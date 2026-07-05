-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: students
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY DEFAULT ('std-' || (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT),
  nisn TEXT UNIQUE NOT NULL,
  nis TEXT,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  academic_year TEXT,
  guardian_name TEXT NOT NULL,
  guardian_phone TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'inactive')),
  spp_amount NUMERIC -- New field for individual SPP amount
);

-- Table: spp_bills
CREATE TABLE IF NOT EXISTS spp_bills (
  id TEXT PRIMARY KEY DEFAULT ('bill-' || (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT),
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'pending', 'unpaid', 'partial')),
  due_date DATE NOT NULL
);

-- Table: installments (Extracted from nested array in App.tsx)
CREATE TABLE IF NOT EXISTS installments (
  id TEXT PRIMARY KEY DEFAULT ('inst-' || (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT),
  bill_id TEXT NOT NULL REFERENCES spp_bills(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL,
  reference_number TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('transfer', 'cash'))
);

-- Table: payments
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY DEFAULT ('pay-' || (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT),
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  bill_id TEXT NOT NULL REFERENCES spp_bills(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('transfer', 'cash')),
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  receipt_image TEXT,
  status TEXT NOT NULL DEFAULT 'pending_validation' CHECK (status IN ('pending_validation', 'approved', 'rejected')),
  reference_number TEXT NOT NULL,
  notes TEXT
);

-- Table: meal_finance
CREATE TABLE IF NOT EXISTS meal_finance (
  id TEXT PRIMARY KEY DEFAULT ('mf-' || (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'pending')),
  receipt_image TEXT,
  admin_recorder TEXT,
  item_name TEXT,
  quantity NUMERIC,
  unit TEXT,
  price_per_unit NUMERIC,
  supplier_name TEXT
);

-- RLS Setup
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE spp_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_finance ENABLE ROW LEVEL SECURITY;

-- Allow anon to select from students and spp_bills
CREATE POLICY "Anon can view all students" ON students FOR SELECT TO anon USING (true); 
CREATE POLICY "Anon can view bills" ON spp_bills FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can view installments" ON installments FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert payments" ON payments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can view payments" ON payments FOR SELECT TO anon USING (true); 

-- Allow authenticated users (Admin) full access
CREATE POLICY "Admin full access students" ON students TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access bills" ON spp_bills TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access installments" ON installments TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access payments" ON payments TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access meal_finance" ON meal_finance TO authenticated USING (true) WITH CHECK (true);

-- RPC for Submitting Payment (Locks bill)
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
) RETURNS void AS $$
BEGIN
  INSERT INTO payments (student_id, bill_id, amount, payment_date, method, bank_name, account_number, account_name, receipt_image, reference_number, notes, status)
  VALUES (p_student_id, p_bill_id, p_amount, p_payment_date, p_method, p_bank_name, p_account_number, p_account_name, p_receipt_image, p_reference_number, p_notes, 'pending_validation');

  UPDATE spp_bills
  SET status = 'pending'
  WHERE id = p_bill_id;
END;
$$ LANGUAGE plpgsql;

-- RPC for Approving Payment
CREATE OR REPLACE FUNCTION approve_payment(p_payment_id TEXT) RETURNS void AS $$
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
BEGIN
  SELECT bill_id, amount, payment_date, method, reference_number 
  INTO v_bill_id, v_amount, v_payment_date, v_method, v_reference_number
  FROM payments WHERE id = p_payment_id;

  UPDATE payments SET status = 'approved' WHERE id = p_payment_id;

  INSERT INTO installments (bill_id, amount, payment_date, reference_number, method)
  VALUES (v_bill_id, v_amount, v_payment_date, v_reference_number, v_method);

  SELECT amount, paid_amount INTO v_total_amount, v_current_paid FROM spp_bills WHERE id = v_bill_id;
  v_new_paid := v_current_paid + v_amount;
  
  IF v_new_paid >= v_total_amount THEN
    v_new_status := 'paid';
  ELSE
    v_new_status := 'partial';
  END IF;

  UPDATE spp_bills 
  SET paid_amount = v_new_paid, status = v_new_status
  WHERE id = v_bill_id;
END;
$$ LANGUAGE plpgsql;

-- RPC for Rejecting Payment
CREATE OR REPLACE FUNCTION reject_payment(p_payment_id TEXT, p_reason TEXT) RETURNS void AS $$
DECLARE
  v_bill_id TEXT;
  v_current_paid NUMERIC;
  v_new_status TEXT;
BEGIN
  SELECT bill_id INTO v_bill_id FROM payments WHERE id = p_payment_id;
  
  UPDATE payments 
  SET status = 'rejected', notes = CONCAT_WS(' | ', notes, 'Ditolak: ' || p_reason)
  WHERE id = p_payment_id;

  SELECT paid_amount INTO v_current_paid FROM spp_bills WHERE id = v_bill_id;
  
  IF v_current_paid = 0 THEN
    v_new_status := 'unpaid';
  ELSE
    v_new_status := 'partial';
  END IF;

  UPDATE spp_bills SET status = v_new_status WHERE id = v_bill_id;
END;
$$ LANGUAGE plpgsql;

-- Storage setup for receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view receipts" ON storage.objects FOR SELECT TO public USING (bucket_id = 'receipts');
CREATE POLICY "Anon can upload receipts" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'receipts');
CREATE POLICY "Admin can full access receipts" ON storage.objects TO authenticated USING (bucket_id = 'receipts') WITH CHECK (bucket_id = 'receipts');