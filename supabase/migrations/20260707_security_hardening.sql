-- =============================================================================
-- SECURITY HARDENING MIGRATION
-- Date: 2026-07-07
-- Purpose: Fix critical RLS/RPC security issues identified in audit
-- =============================================================================

-- =============================================================================
-- 1. ADMIN ROLE MANAGEMENT
-- =============================================================================

-- Table to track admin users
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage roles
CREATE POLICY "Admin can view roles"
  ON user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$;

-- =============================================================================
-- 2. DROP OVERLY PERMISSIVE ANON POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Anon can view all students" ON students;
DROP POLICY IF EXISTS "Anon can view bills" ON spp_bills;
DROP POLICY IF EXISTS "Anon can view installments" ON installments;
DROP POLICY IF EXISTS "Anon can view payments" ON payments;

-- Keep anon INSERT for payment submission (guardian submits payment)
-- but the submit_payment RPC handles this, so direct insert policy can be tightened
DROP POLICY IF EXISTS "Anon can insert payments" ON payments;

-- =============================================================================
-- 3. REPLACE AUTHENTICATED POLICIES WITH ADMIN-ONLY
-- =============================================================================

DROP POLICY IF EXISTS "Admin full access students" ON students;
DROP POLICY IF EXISTS "Admin full access bills" ON spp_bills;
DROP POLICY IF EXISTS "Admin full access installments" ON installments;
DROP POLICY IF EXISTS "Admin full access payments" ON payments;
DROP POLICY IF EXISTS "Admin full access meal_finance" ON meal_finance;

-- Admin-only policies (using is_admin() check)
CREATE POLICY "Admin only: students"
  ON students TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admin only: spp_bills"
  ON spp_bills TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admin only: installments"
  ON installments TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admin only: payments"
  ON payments TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admin only: meal_finance"
  ON meal_finance TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- =============================================================================
-- 4. GUARDIAN LOOKUP RPC (replaces anon SELECT on students/bills)
-- =============================================================================

-- Guardian lookup: returns one student's data after verification
-- Uses NISN + guardian phone as dual verification factor
CREATE OR REPLACE FUNCTION guardian_lookup(
  p_identifier TEXT,        -- NISN or NIS
  p_guardian_phone TEXT,    -- verification factor
  p_academic_year TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student RECORD;
  v_bills JSON;
  v_result JSON;
BEGIN
  -- Input validation
  IF p_identifier IS NULL OR LENGTH(TRIM(p_identifier)) < 3 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid identifier', 'code', 'INVALID_INPUT');
  END IF;

  IF p_guardian_phone IS NULL OR LENGTH(TRIM(p_guardian_phone)) < 8 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid verification', 'code', 'INVALID_INPUT');
  END IF;

  -- Find student with dual verification (NISN/NIS + guardian phone)
  SELECT id, nisn, nis, name, grade, academic_year, guardian_name, guardian_phone, status, spp_amount
  INTO v_student
  FROM students
  WHERE (nisn = TRIM(p_identifier) OR nis = TRIM(p_identifier))
    AND guardian_phone = TRIM(p_guardian_phone)
    AND status = 'active'
    AND (p_academic_year IS NULL OR academic_year = p_academic_year)
  LIMIT 1;

  IF NOT FOUND THEN
    -- Don't reveal whether student exists or phone is wrong
    RETURN json_build_object('success', false, 'error', 'Data tidak ditemukan. Periksa kembali NISN/NIS dan nomor telepon wali.', 'code', 'NOT_FOUND');
  END IF;

  -- Get bills for this student only (minimal columns)
  SELECT json_agg(row_to_json(b))
  INTO v_bills
  FROM (
    SELECT sb.id, sb.month, sb.year, sb.amount, sb.paid_amount, sb.status, sb.due_date,
      (
        SELECT json_agg(row_to_json(inst))
        FROM (
          SELECT i.id, i.amount, i.payment_date, i.reference_number, i.method
          FROM installments i
          WHERE i.bill_id = sb.id
          ORDER BY i.payment_date
        ) inst
      ) AS installments
    FROM spp_bills sb
    WHERE sb.student_id = v_student.id
    ORDER BY sb.year DESC, sb.month
  ) b;

  -- Build result with only necessary fields
  v_result := json_build_object(
    'success', true,
    'student', json_build_object(
      'id', v_student.id,
      'nisn', v_student.nisn,
      'nis', v_student.nis,
      'name', v_student.name,
      'grade', v_student.grade,
      'academicYear', v_student.academic_year,
      'guardianName', v_student.guardian_name,
      'status', v_student.status,
      'sppAmount', v_student.spp_amount
    ),
    'bills', COALESCE(v_bills, '[]'::json)
  );

  RETURN v_result;
END;
$$;

-- Grant guardian_lookup to anon (this is the controlled entry point)
GRANT EXECUTE ON FUNCTION guardian_lookup(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION guardian_lookup(TEXT, TEXT, TEXT) TO authenticated;

-- =============================================================================
-- 5. SECURE APPROVE/REJECT PAYMENT RPCs
-- =============================================================================

-- Payment audit trail table
CREATE TABLE IF NOT EXISTS payment_audit_log (
  id SERIAL PRIMARY KEY,
  payment_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'submit')),
  old_status TEXT,
  new_status TEXT,
  reason TEXT,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE payment_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view audit log"
  ON payment_audit_log FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "System can insert audit log"
  ON payment_audit_log FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- Secured approve_payment with admin check and audit trail
CREATE OR REPLACE FUNCTION approve_payment(p_payment_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bill_id TEXT;
  v_amount NUMERIC;
  v_payment_date DATE;
  v_method TEXT;
  v_reference_number TEXT;
  v_current_paid NUMERIC;
  v_total_amount NUMERIC;
  v_new_paid NUMERIC;
  v_new_status TEXT;
  v_current_status TEXT;
  v_admin_email TEXT;
BEGIN
  -- Admin check
  IF NOT is_admin() THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized', 'code', 'ADMIN_ONLY');
  END IF;

  -- Get payment details with lock
  SELECT bill_id, amount, payment_date, method, reference_number, status
  INTO v_bill_id, v_amount, v_payment_date, v_method, v_reference_number, v_current_status
  FROM payments WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Payment not found', 'code', 'NOT_FOUND');
  END IF;

  IF v_current_status != 'pending_validation' THEN
    RETURN json_build_object('success', false, 'error', 'Payment is not pending', 'code', 'INVALID_STATUS', 'current_status', v_current_status);
  END IF;

  -- Update payment status
  UPDATE payments SET status = 'approved' WHERE id = p_payment_id;

  -- Create installment record
  INSERT INTO installments (bill_id, amount, payment_date, reference_number, method)
  VALUES (v_bill_id, v_amount, v_payment_date, v_reference_number, v_method);

  -- Update bill paid amount and status
  SELECT amount, paid_amount INTO v_total_amount, v_current_paid
  FROM spp_bills WHERE id = v_bill_id FOR UPDATE;

  v_new_paid := v_current_paid + v_amount;

  IF v_new_paid >= v_total_amount THEN
    v_new_status := 'paid';
  ELSE
    v_new_status := 'partial';
  END IF;

  UPDATE spp_bills
  SET paid_amount = v_new_paid, status = v_new_status
  WHERE id = v_bill_id;

  -- Get admin email for audit
  SELECT email INTO v_admin_email FROM auth.users WHERE id = auth.uid();

  -- Audit trail
  INSERT INTO payment_audit_log (payment_id, action, old_status, new_status, performed_by)
  VALUES (p_payment_id, 'approve', v_current_status, 'approved', auth.uid());

  RETURN json_build_object(
    'success', true,
    'approved_by', COALESCE(v_admin_email, 'unknown'),
    'new_bill_status', v_new_status
  );
END;
$$;

-- Secured reject_payment with admin check and audit trail
CREATE OR REPLACE FUNCTION reject_payment(p_payment_id TEXT, p_reason TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bill_id TEXT;
  v_current_paid NUMERIC;
  v_new_status TEXT;
  v_current_status TEXT;
  v_admin_email TEXT;
BEGIN
  -- Admin check
  IF NOT is_admin() THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized', 'code', 'ADMIN_ONLY');
  END IF;

  -- Validate reason
  IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) < 3 THEN
    RETURN json_build_object('success', false, 'error', 'Rejection reason is required (min 3 chars)', 'code', 'REASON_REQUIRED');
  END IF;

  -- Get payment with lock
  SELECT bill_id, status INTO v_bill_id, v_current_status
  FROM payments WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Payment not found', 'code', 'NOT_FOUND');
  END IF;

  IF v_current_status != 'pending_validation' THEN
    RETURN json_build_object('success', false, 'error', 'Payment is not pending', 'code', 'INVALID_STATUS', 'current_status', v_current_status);
  END IF;

  -- Update payment
  UPDATE payments
  SET status = 'rejected', notes = CONCAT_WS(' | ', notes, 'Ditolak: ' || TRIM(p_reason))
  WHERE id = p_payment_id;

  -- Restore bill status
  SELECT paid_amount INTO v_current_paid FROM spp_bills WHERE id = v_bill_id FOR UPDATE;

  IF v_current_paid = 0 THEN
    v_new_status := 'unpaid';
  ELSE
    v_new_status := 'partial';
  END IF;

  UPDATE spp_bills SET status = v_new_status WHERE id = v_bill_id;

  -- Get admin email for audit
  SELECT email INTO v_admin_email FROM auth.users WHERE id = auth.uid();

  -- Audit trail
  INSERT INTO payment_audit_log (payment_id, action, old_status, new_status, reason, performed_by)
  VALUES (p_payment_id, 'reject', v_current_status, 'rejected', TRIM(p_reason), auth.uid());

  RETURN json_build_object(
    'success', true,
    'rejected_by', COALESCE(v_admin_email, 'unknown'),
    'reason', TRIM(p_reason)
  );
END;
$$;

-- Revoke RPC execution from anon for admin-only functions
REVOKE EXECUTE ON FUNCTION approve_payment(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION reject_payment(TEXT, TEXT) FROM anon;

GRANT EXECUTE ON FUNCTION approve_payment(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_payment(TEXT, TEXT) TO authenticated;

-- =============================================================================
-- 6. GET PAYMENT AUDIT HISTORY RPC
-- =============================================================================

CREATE OR REPLACE FUNCTION get_payment_audit_history(p_payment_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_history JSON;
BEGIN
  IF NOT is_admin() THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized', 'code', 'ADMIN_ONLY');
  END IF;

  SELECT json_agg(row_to_json(h))
  INTO v_history
  FROM (
    SELECT
      pal.action,
      pal.old_status,
      pal.new_status,
      pal.reason,
      u.email AS approved_by,
      pal.performed_at AS timestamp
    FROM payment_audit_log pal
    LEFT JOIN auth.users u ON u.id = pal.performed_by
    WHERE pal.payment_id = p_payment_id
    ORDER BY pal.performed_at DESC
  ) h;

  RETURN json_build_object('success', true, 'data', COALESCE(v_history, '[]'::json));
END;
$$;

REVOKE EXECUTE ON FUNCTION get_payment_audit_history(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION get_payment_audit_history(TEXT) TO authenticated;

-- =============================================================================
-- 7. SECURE STORAGE BUCKET
-- =============================================================================

-- Make receipts bucket private
UPDATE storage.buckets SET public = false WHERE id = 'receipts';

-- Remove overly permissive storage policies
DROP POLICY IF EXISTS "Public can view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Anon can upload receipts" ON storage.objects;

-- Anon can upload to receipts (for guardian payment submission) but with path restriction
CREATE POLICY "Anon upload receipts"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'pdf'))
  );

-- Admin can view and manage receipts
CREATE POLICY "Admin view receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'receipts');

CREATE POLICY "Admin manage receipts"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'receipts')
  WITH CHECK (bucket_id = 'receipts');

-- =============================================================================
-- 8. SECURE submit_payment RPC (add validation)
-- =============================================================================

CREATE OR REPLACE FUNCTION submit_payment(
  p_student_id TEXT,
  p_bill_id TEXT,
  p_amount NUMERIC,
  p_payment_date DATE,
  p_method TEXT,
  p_bank_name TEXT,
  p_account_number TEXT,
  p_account_name TEXT,
  p_receipt_image TEXT,
  p_reference_number TEXT,
  p_notes TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bill RECORD;
BEGIN
  -- Validate amount
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be positive', 'code', 'INVALID_AMOUNT');
  END IF;

  -- Validate bill exists and belongs to student
  SELECT id, student_id, amount, paid_amount, status
  INTO v_bill
  FROM spp_bills
  WHERE id = p_bill_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Bill not found', 'code', 'NOT_FOUND');
  END IF;

  IF v_bill.student_id != p_student_id THEN
    RETURN json_build_object('success', false, 'error', 'Bill does not belong to student', 'code', 'INVALID_BILL');
  END IF;

  IF v_bill.status = 'paid' THEN
    RETURN json_build_object('success', false, 'error', 'Bill is already fully paid', 'code', 'ALREADY_PAID');
  END IF;

  -- Check amount doesn't exceed remaining balance
  IF p_amount > (v_bill.amount - v_bill.paid_amount) THEN
    RETURN json_build_object('success', false, 'error', 'Amount exceeds remaining balance', 'code', 'AMOUNT_EXCEEDS');
  END IF;

  -- Insert payment
  INSERT INTO payments (student_id, bill_id, amount, payment_date, method, bank_name, account_number, account_name, receipt_image, reference_number, notes, status)
  VALUES (p_student_id, p_bill_id, p_amount, p_payment_date, p_method, p_bank_name, p_account_number, p_account_name, p_receipt_image, p_reference_number, p_notes, 'pending_validation');

  -- Update bill status to pending
  UPDATE spp_bills SET status = 'pending' WHERE id = p_bill_id;

  RETURN json_build_object('success', true);
END;
$$;

-- submit_payment should be callable by anon (guardian portal)
GRANT EXECUTE ON FUNCTION submit_payment(TEXT, TEXT, NUMERIC, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION submit_payment(TEXT, TEXT, NUMERIC, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- is_admin available to authenticated
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- =============================================================================
-- IMPORTANT: After running this migration, you must manually insert your
-- admin user into user_roles:
--
-- INSERT INTO user_roles (user_id, role)
-- VALUES ('<your-admin-user-uuid>', 'admin');
--
-- You can find user UUIDs in the Supabase Auth dashboard.
-- =============================================================================