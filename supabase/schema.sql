-- Enable Extension yang dibutuhkan
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

-- Kunci enkripsi default (dapat diganti melalui settings database)
-- ponytail: upgrade ke vault secret manager Supabase di production
CREATE OR REPLACE FUNCTION get_encrypt_key() RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(current_setting('app.settings.encryption_key', true), 'super-secret-khairaat-key');
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 1. CMS TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS site_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID -- FK auth.users (akan diset manual via RLS/App jika login)
);

CREATE TABLE IF NOT EXISTS about_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  history TEXT NOT NULL,
  vision TEXT NOT NULL,
  mission JSONB NOT NULL, -- Array dari misi
  values JSONB NOT NULL, -- Array dari object {title, description}
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);

CREATE TABLE IF NOT EXISTS news_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

CREATE TABLE IF NOT EXISTS gallery_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

CREATE TABLE IF NOT EXISTS programs_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS academic_years (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('SMP', 'SMA')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. RBAC (ROLE BASED ACCESS CONTROL) TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  module TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- =============================================================================
-- 3. CORE & FINANCE TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nisn TEXT UNIQUE NOT NULL CHECK (length(nisn) = 10),
  nis TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  guardian_name TEXT NOT NULL,
  guardian_phone BYTEA NOT NULL, -- Kolom terenkripsi
  guardian_phone_last4 TEXT NOT NULL, -- 4 digit terakhir nomor telepon untuk lookup cepat
  address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'inactive')),
  spp_amount NUMERIC NOT NULL CHECK (spp_amount >= 0)
);

CREATE TABLE IF NOT EXISTS spp_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  month TEXT NOT NULL, -- Bulan dalam format string (misal: "Juli")
  year INTEGER NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  paid_amount NUMERIC NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid', 'overdue')),
  due_date DATE NOT NULL,
  CONSTRAINT unique_student_month_year UNIQUE (student_id, month, year)
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  bill_id UUID NOT NULL REFERENCES spp_bills(id) ON DELETE RESTRICT,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('transfer', 'cash')),
  bank_name TEXT,
  account_number BYTEA, -- Kolom terenkripsi
  account_name TEXT,
  receipt_image TEXT,
  status TEXT NOT NULL DEFAULT 'pending_validation' CHECK (status IN ('pending_validation', 'approved', 'rejected')),
  reference_number TEXT NOT NULL UNIQUE,
  notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS installments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES spp_bills(id) ON DELETE RESTRICT,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL,
  reference_number TEXT NOT NULL UNIQUE,
  method TEXT NOT NULL CHECK (method IN ('transfer', 'cash')),
  recorded_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS meal_finance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'pending')),
  receipt_image TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  item_name TEXT,
  quantity NUMERIC CHECK (quantity > 0),
  unit TEXT,
  price_per_unit NUMERIC CHECK (price_per_unit > 0),
  supplier_name TEXT,
  CONSTRAINT chk_meal_amount CHECK (quantity IS NULL OR amount = quantity * price_per_unit)
);

CREATE TABLE IF NOT EXISTS payment_audit_log (
  id BIGSERIAL PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('submit', 'approve', 'reject', 'resubmit')),
  old_status TEXT,
  new_status TEXT,
  reason TEXT,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 4. NEW CMS & PUBLIC INTERACTION TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  sections JSONB NOT NULL, -- Array dari layout sections
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS nav_menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  url TEXT,
  parent_id UUID REFERENCES nav_menus(id) ON DELETE CASCADE,
  location TEXT NOT NULL CHECK (location IN ('header', 'footer')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS media_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'document')),
  file_size INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'Umum',
  alt_text TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('news_articles', 'programs_data')),
  field_key TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'select', 'textarea', 'boolean')),
  options JSONB,
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT unique_entity_field UNIQUE (entity_type, field_key)
);

CREATE TABLE IF NOT EXISTS custom_field_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  custom_field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  value TEXT
);

CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hero_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  cta_text TEXT,
  cta_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date DATE,
  end_date DATE
);

CREATE TABLE IF NOT EXISTS ppdb_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  birth_place TEXT,
  birth_date DATE,
  gender TEXT NOT NULL CHECK (gender IN ('L', 'P')),
  address TEXT,
  previous_school TEXT,
  program_id UUID REFERENCES programs_data(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ppdb_parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES ppdb_registrations(id) ON DELETE CASCADE,
  father_name TEXT,
  father_occupation TEXT,
  mother_name TEXT,
  mother_occupation TEXT,
  parent_phone BYTEA NOT NULL, -- Kolom terenkripsi
  guardian_name TEXT
);

CREATE TABLE IF NOT EXISTS ppdb_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES ppdb_registrations(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('kk', 'akte', 'ijazah', 'rapor', 'foto')),
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ppdb_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES ppdb_registrations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'verified', 'accepted', 'rejected', 'enrolled')),
  notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_meta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('news_articles', 'pages', 'programs_data', 'global')),
  entity_id UUID,
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  keywords TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_seo_entity UNIQUE (entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 5. FOREIGN KEY CONSTRAINTS FOR CMS CREATED_BY / UPDATED_BY
-- =============================================================================

-- drop existing constraints before adding them to prevent duplicate constraint errors
ALTER TABLE site_config DROP CONSTRAINT IF EXISTS site_config_updated_by_fkey;
ALTER TABLE site_config ADD CONSTRAINT site_config_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);

ALTER TABLE about_content DROP CONSTRAINT IF EXISTS about_content_updated_by_fkey;
ALTER TABLE about_content ADD CONSTRAINT about_content_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);

ALTER TABLE news_articles DROP CONSTRAINT IF EXISTS news_articles_created_by_fkey;
ALTER TABLE news_articles ADD CONSTRAINT news_articles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE news_articles DROP CONSTRAINT IF EXISTS news_articles_updated_by_fkey;
ALTER TABLE news_articles ADD CONSTRAINT news_articles_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);

ALTER TABLE gallery_items DROP CONSTRAINT IF EXISTS gallery_items_created_by_fkey;
ALTER TABLE gallery_items ADD CONSTRAINT gallery_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_created_by_fkey;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- =============================================================================
-- 6. ROW LEVEL SECURITY (RLS) & IS_ADMIN HELPER
-- =============================================================================

-- Helper Check Admin (Memeriksa ID di user_roles dan nama role di roles)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.name IN ('super_admin', 'admin')
  );
$$;

-- RLS Setup
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE spp_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE nav_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppdb_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppdb_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppdb_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppdb_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist before creating
DROP POLICY IF EXISTS "Public view CMS site_config" ON site_config;
DROP POLICY IF EXISTS "Admin CRUD CMS site_config" ON site_config;
DROP POLICY IF EXISTS "Public view CMS about_content" ON about_content;
DROP POLICY IF EXISTS "Admin CRUD CMS about_content" ON about_content;
DROP POLICY IF EXISTS "Public view CMS news_articles" ON news_articles;
DROP POLICY IF EXISTS "Admin CRUD CMS news_articles" ON news_articles;
DROP POLICY IF EXISTS "Public view CMS gallery_items" ON gallery_items;
DROP POLICY IF EXISTS "Admin CRUD CMS gallery_items" ON gallery_items;
DROP POLICY IF EXISTS "Public view CMS programs_data" ON programs_data;
DROP POLICY IF EXISTS "Admin CRUD CMS programs_data" ON programs_data;
DROP POLICY IF EXISTS "Public view CMS pages" ON pages;
DROP POLICY IF EXISTS "Admin CRUD CMS pages" ON pages;
DROP POLICY IF EXISTS "Public view CMS nav_menus" ON nav_menus;
DROP POLICY IF EXISTS "Admin CRUD CMS nav_menus" ON nav_menus;
DROP POLICY IF EXISTS "Public view CMS faqs" ON faqs;
DROP POLICY IF EXISTS "Admin CRUD CMS faqs" ON faqs;
DROP POLICY IF EXISTS "Public view CMS hero_banners" ON hero_banners;
DROP POLICY IF EXISTS "Admin CRUD CMS hero_banners" ON hero_banners;
DROP POLICY IF EXISTS "Public view academic_years" ON academic_years;
DROP POLICY IF EXISTS "Admin CRUD academic_years" ON academic_years;
DROP POLICY IF EXISTS "Public view classes" ON classes;
DROP POLICY IF EXISTS "Admin CRUD classes" ON classes;
DROP POLICY IF EXISTS "Admin CRUD roles" ON roles;
DROP POLICY IF EXISTS "Admin CRUD permissions" ON permissions;
DROP POLICY IF EXISTS "Admin CRUD role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "Admin CRUD user_roles" ON user_roles;
DROP POLICY IF EXISTS "Admin CRUD students" ON students;
DROP POLICY IF EXISTS "Admin CRUD spp_bills" ON spp_bills;
DROP POLICY IF EXISTS "Admin CRUD payments" ON payments;
DROP POLICY IF EXISTS "Admin CRUD installments" ON installments;
DROP POLICY IF EXISTS "Admin CRUD meal_finance" ON meal_finance;
DROP POLICY IF EXISTS "Admin CRUD payment_audit_log" ON payment_audit_log;
DROP POLICY IF EXISTS "Admin CRUD media_library" ON media_library;
DROP POLICY IF EXISTS "Admin CRUD custom_fields" ON custom_fields;
DROP POLICY IF EXISTS "Admin CRUD custom_field_values" ON custom_field_values;
DROP POLICY IF EXISTS "Admin CRUD seo_meta" ON seo_meta;
DROP POLICY IF EXISTS "Admin CRUD newsletter_subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Admin CRUD contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "Admin CRUD ppdb_registrations" ON ppdb_registrations;
DROP POLICY IF EXISTS "Admin CRUD ppdb_parents" ON ppdb_parents;
DROP POLICY IF EXISTS "Admin CRUD ppdb_documents" ON ppdb_documents;
DROP POLICY IF EXISTS "Admin CRUD ppdb_reviews" ON ppdb_reviews;
DROP POLICY IF EXISTS "Public insert contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "Public insert newsletter_subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Public insert ppdb_registrations" ON ppdb_registrations;
DROP POLICY IF EXISTS "Public insert ppdb_parents" ON ppdb_parents;
DROP POLICY IF EXISTS "Public insert ppdb_documents" ON ppdb_documents;

-- CMS Policies (Public View, Admin CRUD)
CREATE POLICY "Public view CMS site_config" ON site_config FOR SELECT TO public USING (true);
CREATE POLICY "Admin CRUD CMS site_config" ON site_config TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public view CMS about_content" ON about_content FOR SELECT TO public USING (true);
CREATE POLICY "Admin CRUD CMS about_content" ON about_content TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public view CMS news_articles" ON news_articles FOR SELECT TO public USING (status = 'published');
CREATE POLICY "Admin CRUD CMS news_articles" ON news_articles TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public view CMS gallery_items" ON gallery_items FOR SELECT TO public USING (true);
CREATE POLICY "Admin CRUD CMS gallery_items" ON gallery_items TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public view CMS programs_data" ON programs_data FOR SELECT TO public USING (true);
CREATE POLICY "Admin CRUD CMS programs_data" ON programs_data TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public view CMS pages" ON pages FOR SELECT TO public USING (status = 'published');
CREATE POLICY "Admin CRUD CMS pages" ON pages TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public view CMS nav_menus" ON nav_menus FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admin CRUD CMS nav_menus" ON nav_menus TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public view CMS faqs" ON faqs FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admin CRUD CMS faqs" ON faqs TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public view CMS hero_banners" ON hero_banners FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admin CRUD CMS hero_banners" ON hero_banners TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public view academic_years" ON academic_years FOR SELECT TO public USING (true);
CREATE POLICY "Admin CRUD academic_years" ON academic_years TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public view classes" ON classes FOR SELECT TO public USING (true);
CREATE POLICY "Admin CRUD classes" ON classes TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Core & Finance Policies (Admin Only)
CREATE POLICY "Admin CRUD roles" ON roles TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin CRUD permissions" ON permissions TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin CRUD role_permissions" ON role_permissions TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin CRUD user_roles" ON user_roles TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin CRUD students" ON students TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin CRUD spp_bills" ON spp_bills TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin CRUD payments" ON payments TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin CRUD installments" ON installments TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin CRUD meal_finance" ON meal_finance TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin CRUD payment_audit_log" ON payment_audit_log TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin CRUD media_library" ON media_library TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin CRUD custom_fields" ON custom_fields TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin CRUD custom_field_values" ON custom_field_values TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin CRUD seo_meta" ON seo_meta TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin CRUD newsletter_subscribers" ON newsletter_subscribers TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin CRUD contact_messages" ON contact_messages TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin CRUD ppdb_registrations" ON ppdb_registrations TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin CRUD ppdb_parents" ON ppdb_parents TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin CRUD ppdb_documents" ON ppdb_documents TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin CRUD ppdb_reviews" ON ppdb_reviews TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Public Insert Policies
CREATE POLICY "Public insert contact_messages" ON contact_messages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public insert newsletter_subscribers" ON newsletter_subscribers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public insert ppdb_registrations" ON ppdb_registrations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public insert ppdb_parents" ON ppdb_parents FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public insert ppdb_documents" ON ppdb_documents FOR INSERT TO anon WITH CHECK (true);

-- =============================================================================
-- 7. SECURED SECURITY DEFINER RPCs
-- =============================================================================

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
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_admin() THEN
    RETURN 'UNAUTHORIZED';
  END IF;
  RETURN public.pgp_sym_decrypt(p_phone, get_encrypt_key());
END;
$$;

CREATE OR REPLACE FUNCTION get_decrypted_account_number(p_acc BYTEA)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_admin() THEN
    RETURN 'UNAUTHORIZED';
  END IF;
  RETURN public.pgp_sym_decrypt(p_acc, get_encrypt_key());
END;
$$;

-- PPDB Enrollment Staf (Santri Baru PPDB disahkan menjadi santri pondok)
CREATE OR REPLACE FUNCTION enroll_ppdb_student(p_registration_id UUID, p_class_id UUID, p_academic_year_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
    RIGHT(public.pgp_sym_decrypt(v_parent.parent_phone, get_encrypt_key()), 4),
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

-- Grant Execution Roles
GRANT EXECUTE ON FUNCTION guardian_lookup(TEXT, TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION submit_payment(UUID, UUID, NUMERIC, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION approve_payment(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_payment(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_decrypted_guardian_phone(BYTEA) TO authenticated;
GRANT EXECUTE ON FUNCTION get_decrypted_account_number(BYTEA) TO authenticated;

CREATE OR REPLACE FUNCTION get_decrypted_phone_by_student_id(p_student_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_phone BYTEA;
BEGIN
  IF NOT is_admin() THEN
    RETURN 'UNAUTHORIZED';
  END IF;
  SELECT guardian_phone INTO v_phone FROM public.students WHERE id = p_student_id;
  IF v_phone IS NULL THEN
    RETURN 'NOT_FOUND';
  END IF;
  RETURN pgp_sym_decrypt(v_phone, get_encrypt_key());
END;
$$;

GRANT EXECUTE ON FUNCTION get_decrypted_phone_by_student_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION enroll_ppdb_student(UUID, UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION encrypt_val(p_val TEXT)
RETURNS BYTEA LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  RETURN pgp_sym_encrypt(p_val, get_encrypt_key());
END;
$$;

GRANT EXECUTE ON FUNCTION encrypt_val(TEXT) TO anon, authenticated;
