-- Migration: Fix pgcrypto search path issues in security definer functions
-- Date: 2026-07-22

-- 1. DROP EXISTING FUNCTIONS TO AVOID CONFLICTS
DROP FUNCTION IF EXISTS guardian_lookup(TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS submit_payment(UUID, UUID, NUMERIC, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS approve_payment(UUID);
DROP FUNCTION IF EXISTS reject_payment(UUID, TEXT);
DROP FUNCTION IF EXISTS get_decrypted_guardian_phone(BYTEA);
DROP FUNCTION IF EXISTS get_decrypted_account_number(BYTEA);
DROP FUNCTION IF EXISTS enroll_ppdb_student(UUID, UUID, UUID);

-- 2. CREATE FUNCTION WITH CORRECT SEARCH PATH (public, extensions)

-- Lookup Wali (Verifikasi Ganda + Dekripsi Data HP Wali)
CREATE OR REPLACE FUNCTION guardian_lookup(
  p_identifier TEXT,
  p_guardian_phone TEXT,
  p_academic_year_id UUID DEFAULT NULL
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_student RECORD;
  v_bills JSON;
  v_result JSON;
BEGIN
  SELECT s.id, s.nisn, s.nis, s.name, c.name AS grade, ay.name AS academic_year, s.guardian_name, s.status, s.spp_amount
  INTO v_student
  FROM students s
  JOIN classes c ON c.id = s.class_id
  JOIN academic_years ay ON ay.id = s.academic_year_id
  WHERE (s.nisn = TRIM(p_identifier) OR s.nis = TRIM(p_identifier))
    AND pgp_sym_decrypt(s.guardian_phone, get_encrypt_key()) = TRIM(p_guardian_phone)
    AND s.status = 'active'
    AND (p_academic_year_id IS NULL OR s.academic_year_id = p_academic_year_id)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Data tidak ditemukan. Cek NISN/NIS & No. Telepon.', 'code', 'NOT_FOUND');
  END IF;

  SELECT json_agg(row_to_json(b)) INTO v_bills FROM (
    SELECT sb.id, sb.month, sb.year, sb.amount, sb.paid_amount, sb.status, sb.due_date,
      (
        SELECT json_agg(row_to_json(inst)) FROM (
          SELECT i.id, i.amount, i.payment_date, i.reference_number, i.method
          FROM installments i WHERE i.bill_id = sb.id ORDER BY i.payment_date
        ) inst
      ) AS installments
    FROM spp_bills sb WHERE sb.student_id = v_student.id ORDER BY sb.year DESC, sb.month
  ) b;

  RETURN json_build_object(
    'success', true,
    'student', json_build_object(
      'id', v_student.id, 'nisn', v_student.nisn, 'nis', v_student.nis,
      'name', v_student.name, 'grade', v_student.grade, 'academicYear', v_student.academic_year,
      'guardianName', v_student.guardian_name, 'status', v_student.status, 'sppAmount', v_student.spp_amount
    ),
    'bills', COALESCE(v_bills, '[]'::json)
  );
END;
$$;

-- Submit Pembayaran (Validasi Bisnis + Enkripsi No Rekening + Log Audit)
CREATE OR REPLACE FUNCTION submit_payment(
  p_student_id UUID,
  p_bill_id UUID,
  p_amount NUMERIC,
  p_payment_date DATE,
  p_method TEXT,
  p_bank_name TEXT,
  p_account_number TEXT,
  p_account_name TEXT,
  p_receipt_image TEXT,
  p_reference_number TEXT,
  p_notes TEXT
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_bill RECORD;
  v_payment_id UUID;
BEGIN
  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Nominal harus lebih dari nol', 'code', 'INVALID_AMOUNT');
  END IF;

  SELECT id, student_id, amount, paid_amount, status INTO v_bill
  FROM spp_bills WHERE id = p_bill_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Tagihan tidak ditemukan', 'code', 'NOT_FOUND');
  END IF;

  IF v_bill.student_id != p_student_id THEN
    RETURN json_build_object('success', false, 'error', 'Tagihan tidak sesuai dengan santri', 'code', 'INVALID_BILL');
  END IF;

  IF v_bill.status = 'paid' THEN
    RETURN json_build_object('success', false, 'error', 'Tagihan sudah lunas', 'code', 'ALREADY_PAID');
  END IF;

  IF p_amount > (v_bill.amount - v_bill.paid_amount) THEN
    RETURN json_build_object('success', false, 'error', 'Nominal melebihi sisa tagihan', 'code', 'AMOUNT_EXCEEDS');
  END IF;

  INSERT INTO payments (
    student_id, bill_id, amount, payment_date, method, bank_name,
    account_number, account_name, receipt_image, reference_number, notes, status
  ) VALUES (
    p_student_id, p_bill_id, p_amount, p_payment_date, p_method, p_bank_name,
    pgp_sym_encrypt(p_account_number, get_encrypt_key()), p_account_name, p_receipt_image, p_reference_number, p_notes, 'pending_validation'
  ) RETURNING id INTO v_payment_id;

  -- Tambahkan log audit awal
  INSERT INTO payment_audit_log (payment_id, action, old_status, new_status, reason, performed_by)
  VALUES (v_payment_id, 'submit', NULL, 'pending_validation', 'Pengajuan oleh wali santri', NULL);

  RETURN json_build_object('success', true, 'payment_id', v_payment_id);
END;
$$;

-- Approve & Reject RPC
CREATE OR REPLACE FUNCTION approve_payment(p_payment_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_bill_id UUID;
  v_amount NUMERIC;
  v_payment_date DATE;
  v_method TEXT;
  v_reference_number TEXT;
  v_current_paid NUMERIC;
  v_total_amount NUMERIC;
  v_new_paid NUMERIC;
  v_new_status TEXT;
  v_current_status TEXT;
BEGIN
  IF NOT is_admin() THEN
    RETURN json_build_object('success', false, 'error', 'Bukan admin', 'code', 'ADMIN_ONLY');
  END IF;

  SELECT bill_id, amount, payment_date, method, reference_number, status
  INTO v_bill_id, v_amount, v_payment_date, v_method, v_reference_number, v_current_status
  FROM payments WHERE id = p_payment_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Pembayaran tidak ditemukan', 'code', 'NOT_FOUND');
  END IF;

  IF v_current_status != 'pending_validation' THEN
    RETURN json_build_object('success', false, 'error', 'Pembayaran bukan berstatus pending', 'code', 'INVALID_STATUS');
  END IF;

  -- 1. Update payments
  UPDATE payments 
  SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = NOW()
  WHERE id = p_payment_id;

  -- 2. Insert installments
  INSERT INTO installments (bill_id, payment_id, amount, payment_date, reference_number, method, recorded_by)
  VALUES (v_bill_id, p_payment_id, v_amount, v_payment_date, v_reference_number, v_method, auth.uid());

  -- 3. Update spp_bills
  SELECT amount, paid_amount INTO v_total_amount, v_current_paid FROM spp_bills WHERE id = v_bill_id FOR UPDATE;
  v_new_paid := v_current_paid + v_amount;
  
  -- Logic Overdue Check
  IF v_new_paid >= v_total_amount THEN
    v_new_status := 'paid';
  ELSE
    v_new_status := 'partial';
  END IF;

  UPDATE spp_bills SET paid_amount = v_new_paid, status = v_new_status WHERE id = v_bill_id;

  -- 4. Audit Log
  INSERT INTO payment_audit_log (payment_id, action, old_status, new_status, performed_by)
  VALUES (p_payment_id, 'approve', v_current_status, 'approved', auth.uid());

  RETURN json_build_object('success', true, 'new_bill_status', v_new_status);
END;
$$;

CREATE OR REPLACE FUNCTION reject_payment(p_payment_id UUID, p_reason TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_bill_id UUID;
  v_current_paid NUMERIC;
  v_new_status TEXT;
  v_current_status TEXT;
BEGIN
  IF NOT is_admin() THEN
    RETURN json_build_object('success', false, 'error', 'Bukan admin', 'code', 'ADMIN_ONLY');
  END IF;

  IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) < 3 THEN
    RETURN json_build_object('success', false, 'error', 'Alasan penolakan wajib diisi', 'code', 'REASON_REQUIRED');
  END IF;

  SELECT bill_id, status INTO v_bill_id, v_current_status FROM payments WHERE id = p_payment_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Pembayaran tidak ditemukan', 'code', 'NOT_FOUND');
  END IF;

  IF v_current_status != 'pending_validation' THEN
    RETURN json_build_object('success', false, 'error', 'Pembayaran bukan berstatus pending', 'code', 'INVALID_STATUS');
  END IF;

  UPDATE payments 
  SET status = 'rejected', notes = CONCAT_WS(' | ', notes, 'Ditolak: ' || TRIM(p_reason)), reviewed_by = auth.uid(), reviewed_at = NOW()
  WHERE id = p_payment_id;

  SELECT paid_amount INTO v_current_paid FROM spp_bills WHERE id = v_bill_id FOR UPDATE;
  
  -- Restore spp_bills status to unpaid/partial
  IF v_current_paid = 0 THEN
    v_new_status := 'unpaid';
  ELSE
    v_new_status := 'partial';
  END IF;
  UPDATE spp_bills SET status = v_new_status WHERE id = v_bill_id;

  INSERT INTO payment_audit_log (payment_id, action, old_status, new_status, reason, performed_by)
  VALUES (p_payment_id, 'reject', v_current_status, 'rejected', TRIM(p_reason), auth.uid());

  RETURN json_build_object('success', true);
END;
$$;

-- Helper Dekripsi data untuk view admin
CREATE OR REPLACE FUNCTION get_decrypted_guardian_phone(p_phone BYTEA)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  IF NOT is_admin() THEN
    RETURN 'UNAUTHORIZED';
  END IF;
  RETURN pgp_sym_decrypt(p_phone, get_encrypt_key());
END;
$$;

CREATE OR REPLACE FUNCTION get_decrypted_account_number(p_acc BYTEA)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  IF NOT is_admin() THEN
    RETURN 'UNAUTHORIZED';
  END IF;
  RETURN pgp_sym_decrypt(p_acc, get_encrypt_key());
END;
$$;

-- PPDB Enrollment Staf (Santri Baru PPDB disahkan menjadi santri pondok)
CREATE OR REPLACE FUNCTION enroll_ppdb_student(p_registration_id UUID, p_class_id UUID, p_academic_year_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_reg RECORD;
  v_parent RECORD;
  v_student_id UUID;
BEGIN
  IF NOT is_admin() THEN
    RETURN json_build_object('success', false, 'error', 'Bukan admin', 'code', 'ADMIN_ONLY');
  END IF;

  SELECT * INTO v_reg FROM ppdb_registrations WHERE id = p_registration_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Pendaftaran tidak ditemukan', 'code', 'NOT_FOUND');
  END IF;

  SELECT * INTO v_parent FROM ppdb_parents WHERE registration_id = p_registration_id;

  -- Generate NIS (Contoh pola: Tahun Masuk + Running Number)
  -- ponytail: upgrade generator NIS yang lebih kompleks di production jika perlu
  INSERT INTO students (
    nisn, nis, name, class_id, academic_year_id, guardian_name, guardian_phone, guardian_phone_last4, address, status, spp_amount
  ) VALUES (
    '0000000000', -- Fallback jika belum input NISN
    'REG-' || (EXTRACT(EPOCH FROM NOW())::BIGINT % 1000000)::TEXT,
    v_reg.full_name,
    p_class_id,
    p_academic_year_id,
    COALESCE(v_parent.guardian_name, v_parent.father_name, v_parent.mother_name, 'Orang Tua Wali'),
    v_parent.parent_phone,
    RIGHT(pgp_sym_decrypt(v_parent.parent_phone, get_encrypt_key()), 4),
    COALESCE(v_reg.address, 'Alamat belum diinput'),
    'active',
    500000 -- Default nominal SPP
  ) RETURNING id INTO v_student_id;

  -- Insert Log review sebagai PPDB Enrolled
  INSERT INTO ppdb_reviews (registration_id, status, notes, reviewed_by)
  VALUES (p_registration_id, 'enrolled', 'Calon santri telah sukses diregistrasi masuk menjadi santri aktif.', auth.uid());

  RETURN json_build_object('success', true, 'student_id', v_student_id);
END;
$$;

-- 3. GRANT PERMISSION BACK
GRANT EXECUTE ON FUNCTION guardian_lookup(TEXT, TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION submit_payment(UUID, UUID, NUMERIC, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION approve_payment(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_payment(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_decrypted_guardian_phone(BYTEA) TO authenticated;
GRANT EXECUTE ON FUNCTION get_decrypted_account_number(BYTEA) TO authenticated;
GRANT EXECUTE ON FUNCTION enroll_ppdb_student(UUID, UUID, UUID) TO authenticated;
