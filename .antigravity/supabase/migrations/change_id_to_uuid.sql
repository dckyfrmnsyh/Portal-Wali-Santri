-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop foreign key constraints first
ALTER TABLE spp_bills DROP CONSTRAINT IF EXISTS spp_bills_student_id_fkey;
ALTER TABLE installments DROP CONSTRAINT IF EXISTS installments_bill_id_fkey;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_student_id_fkey;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_bill_id_fkey;
ALTER TABLE meal_finance DROP CONSTRAINT IF EXISTS meal_finance_student_id_fkey;

-- Create temporary tables to map old TEXT IDs to new UUID IDs
CREATE TEMPORARY TABLE old_to_new_student_ids (
    old_id TEXT PRIMARY KEY,
    new_id UUID UNIQUE
);

CREATE TEMPORARY TABLE old_to_new_spp_bill_ids (
    old_id TEXT PRIMARY KEY,
    new_id UUID UNIQUE
);

CREATE TEMPORARY TABLE old_to_new_installment_ids (
    old_id TEXT PRIMARY KEY,
    new_id UUID UNIQUE
);

CREATE TEMPORARY TABLE old_to_new_payment_ids (
    old_id TEXT PRIMARY KEY,
    new_id UUID UNIQUE
);

CREATE TEMPORARY TABLE old_to_new_meal_finance_ids (
    old_id TEXT PRIMARY KEY,
    new_id UUID UNIQUE
);

-- Populate mapping tables and convert primary keys to UUID
-- Students table
INSERT INTO old_to_new_student_ids (old_id, new_id)
SELECT id, uuid_generate_v4() FROM students;

ALTER TABLE students ADD COLUMN new_id UUID NOT NULL DEFAULT uuid_generate_v4();
UPDATE students SET new_id = (SELECT new_id FROM old_to_new_student_ids WHERE old_to_new_student_ids.old_id = students.id);
ALTER TABLE students DROP COLUMN id;
ALTER TABLE students RENAME COLUMN new_id TO id;
ALTER TABLE students ADD PRIMARY KEY (id);
ALTER TABLE students ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- spp_bills table
INSERT INTO old_to_new_spp_bill_ids (old_id, new_id)
SELECT id, uuid_generate_v4() FROM spp_bills;

ALTER TABLE spp_bills ADD COLUMN new_id UUID NOT NULL DEFAULT uuid_generate_v4();
UPDATE spp_bills SET new_id = (SELECT new_id FROM old_to_new_spp_bill_ids WHERE old_to_new_spp_bill_ids.old_id = spp_bills.id);
ALTER TABLE spp_bills DROP COLUMN id;
ALTER TABLE spp_bills RENAME COLUMN new_id TO id;
ALTER TABLE spp_bills ADD PRIMARY KEY (id);
ALTER TABLE spp_bills ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- installments table
INSERT INTO old_to_new_installment_ids (old_id, new_id)
SELECT id, uuid_generate_v4() FROM installments;

ALTER TABLE installments ADD COLUMN new_id UUID NOT NULL DEFAULT uuid_generate_v4();
UPDATE installments SET new_id = (SELECT new_id FROM old_to_new_installment_ids WHERE old_to_new_installment_ids.old_id = installments.id);
ALTER TABLE installments DROP COLUMN id;
ALTER TABLE installments RENAME COLUMN new_id TO id;
ALTER TABLE installments ADD PRIMARY KEY (id);
ALTER TABLE installments ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- payments table
INSERT INTO old_to_new_payment_ids (old_id, new_id)
SELECT id, uuid_generate_v4() FROM payments;

ALTER TABLE payments ADD COLUMN new_id UUID NOT NULL DEFAULT uuid_generate_v4();
UPDATE payments SET new_id = (SELECT new_id FROM old_to_new_payment_ids WHERE old_to_new_payment_ids.old_id = payments.id);
ALTER TABLE payments DROP COLUMN id;
ALTER TABLE payments RENAME COLUMN new_id TO id;
ALTER TABLE payments ADD PRIMARY KEY (id);
ALTER TABLE payments ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- meal_finance table
INSERT INTO old_to_new_meal_finance_ids (old_id, new_id)
SELECT id, uuid_generate_v4() FROM meal_finance;

ALTER TABLE meal_finance ADD COLUMN new_id UUID NOT NULL DEFAULT uuid_generate_v4();
UPDATE meal_finance SET new_id = (SELECT new_id FROM old_to_new_meal_finance_ids WHERE old_to_new_meal_finance_ids.old_id = meal_finance.id);
ALTER TABLE meal_finance DROP COLUMN id;
ALTER TABLE meal_finance RENAME COLUMN new_id TO id;
ALTER TABLE meal_finance ADD PRIMARY KEY (id);
ALTER TABLE meal_finance ALTER COLUMN id SET DEFAULT uuid_generate_v4();


-- Convert foreign key columns to UUID using the mapping tables
-- spp_bills.student_id
ALTER TABLE spp_bills ADD COLUMN new_student_id UUID;
UPDATE spp_bills SET new_student_id = (SELECT new_id FROM old_to_new_student_ids WHERE old_to_new_student_ids.old_id = spp_bills.student_id);
ALTER TABLE spp_bills DROP COLUMN student_id;
ALTER TABLE spp_bills RENAME COLUMN new_student_id TO student_id;
ALTER TABLE spp_bills ALTER COLUMN student_id SET NOT NULL; -- Add NOT NULL constraint

-- installments.bill_id
ALTER TABLE installments ADD COLUMN new_bill_id UUID;
UPDATE installments SET new_bill_id = (SELECT new_id FROM old_to_new_spp_bill_ids WHERE old_to_new_spp_bill_ids.old_id = installments.bill_id);
ALTER TABLE installments DROP COLUMN bill_id;
ALTER TABLE installments RENAME COLUMN new_bill_id TO bill_id;
ALTER TABLE installments ALTER COLUMN bill_id SET NOT NULL; -- Add NOT NULL constraint

-- payments.student_id
ALTER TABLE payments ADD COLUMN new_student_id UUID;
UPDATE payments SET new_student_id = (SELECT new_id FROM old_to_new_student_ids WHERE old_to_new_student_ids.old_id = payments.student_id);
ALTER TABLE payments DROP COLUMN student_id;
ALTER TABLE payments RENAME COLUMN new_student_id TO student_id;
ALTER TABLE payments ALTER COLUMN student_id SET NOT NULL; -- Add NOT NULL constraint

-- payments.bill_id
ALTER TABLE payments ADD COLUMN new_bill_id UUID;
UPDATE payments SET new_bill_id = (SELECT new_id FROM old_to_new_spp_bill_ids WHERE old_to_new_spp_bill_ids.old_id = payments.bill_id);
ALTER TABLE payments DROP COLUMN bill_id;
ALTER TABLE payments RENAME COLUMN new_bill_id TO bill_id;
ALTER TABLE payments ALTER COLUMN bill_id SET NOT NULL; -- Add NOT NULL constraint

-- meal_finance.student_id (this one can be NULL, so no SET NOT NULL)
ALTER TABLE meal_finance ADD COLUMN new_student_id UUID;
UPDATE meal_finance SET new_student_id = (SELECT new_id FROM old_to_new_student_ids WHERE old_to_new_student_ids.old_id = meal_finance.student_id);
ALTER TABLE meal_finance DROP COLUMN student_id;
ALTER TABLE meal_finance RENAME COLUMN new_student_id TO student_id;


-- Ensure spp_amount is numeric (this was already there, keeping it)
ALTER TABLE students ALTER COLUMN spp_amount SET DATA TYPE NUMERIC;

-- Re-add foreign key constraints
ALTER TABLE spp_bills ADD CONSTRAINT spp_bills_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE installments ADD CONSTRAINT installments_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES spp_bills(id) ON DELETE CASCADE;
ALTER TABLE payments ADD CONSTRAINT payments_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE payments ADD CONSTRAINT payments_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES spp_bills(id) ON DELETE CASCADE;
ALTER TABLE meal_finance ADD CONSTRAINT meal_finance_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL;

-- Update RPC for Submitting Payment
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
) RETURNS void AS $$
BEGIN
  INSERT INTO payments (student_id, bill_id, amount, payment_date, method, bank_name, account_number, account_name, receipt_image, reference_number, notes, status)
  VALUES (p_student_id, p_bill_id, p_amount, p_payment_date, p_method, p_bank_name, p_account_number, p_account_name, p_receipt_image, p_reference_number, p_notes, 'pending_validation');

  UPDATE spp_bills
  SET status = 'pending'
  WHERE id = p_bill_id;
END;
$$ LANGUAGE plpgsql;

-- Update RPC for Approving Payment
CREATE OR REPLACE FUNCTION approve_payment(p_payment_id UUID) RETURNS void AS $$
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

-- Update RPC for Rejecting Payment
CREATE OR REPLACE FUNCTION reject_payment(p_payment_id UUID, p_reason TEXT) RETURNS void AS $$
DECLARE
  v_bill_id UUID;
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

-- Add unique constraint to spp_bills
ALTER TABLE spp_bills ADD CONSTRAINT unique_student_month_year UNIQUE (student_id, month, year);