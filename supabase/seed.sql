-- =============================================================================
-- SEED DATA FOR AL-KHAIRAAT TANA TIDUNG PORTAL
-- Run this in Supabase SQL Editor to populate initial master & CMS data.
-- =============================================================================

-- 1. SEED MASTER ROLES
INSERT INTO roles (id, name, description) VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'super_admin', 'Akses penuh ke seluruh sistem dan konfigurasi hak akses'),
  ('b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e', 'admin', 'Akses administratif pengelolaan data santri dan tagihan'),
  ('c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f', 'bendahara', 'Khusus mengelola SPP, keuangan katering, dan approval pembayaran'),
  ('d4e5f67a-8b9c-0d1e-2f3a-4b5c6d7e8f9a', 'editor_konten', 'Mengelola konten landing page berita, galeri, dan banner')
ON CONFLICT (name) DO NOTHING;

-- 2. SEED MASTER PERMISSIONS
INSERT INTO permissions (id, code, description, module) VALUES
  (uuid_generate_v4(), 'news.create', 'Membuat draft berita baru', 'Artikel & Berita'),
  (uuid_generate_v4(), 'news.publish', 'Mempublikasikan berita', 'Artikel & Berita'),
  (uuid_generate_v4(), 'payment.approve', 'Menyetujui konfirmasi pembayaran', 'Kelola Keuangan'),
  (uuid_generate_v4(), 'payment.reject', 'Menolak konfirmasi pembayaran', 'Kelola Keuangan'),
  (uuid_generate_v4(), 'students.manage', 'CRUD data profil santri', 'Kelola Data Santri'),
  (uuid_generate_v4(), 'settings.edit', 'Mengubah konfigurasi situs', 'Pengaturan Web')
ON CONFLICT (code) DO NOTHING;

-- 3. SEED MASTER ACADEMIC YEARS
INSERT INTO academic_years (id, name, is_active) VALUES
  ('e5f67a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b', '2025/2026', false),
  ('f67a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c', '2026/2027', true)
ON CONFLICT (name) DO NOTHING;

-- 4. SEED MASTER CLASSES
INSERT INTO classes (id, name, level) VALUES
  ('11111111-2222-3333-4444-555555555555', '7-A SMP', 'SMP'),
  ('22222222-3333-4444-5555-666666666666', 'VII A (SMP)', 'SMP'),
  ('33333333-4444-5555-6666-777777777777', '10-A SMA', 'SMA'),
  ('44444444-5555-6666-7777-888888888888', 'X IPA (SMA)', 'SMA')
ON CONFLICT (name) DO NOTHING;

-- 5. SEED CONFIG WEBSITE (site_config)
INSERT INTO site_config (key, value) VALUES
  ('schoolName', 'Pondok Pesantren Khairaat Tana Tidung'),
  ('schoolShortName', 'Ponpes Khairaat'),
  ('location', 'Kec. Sesayap Hilir, Kab. Tana Tidung, Kalimantan Utara'),
  ('locationShort', 'Tana Tidung, Kaltara'),
  ('adminPhone', '+62 821-8450-9719'),
  ('whatsappUrl', 'https://wa.me/6282184509719'),
  ('email', 'info@ponpeskhairaattanatidung.sch.id'),
  ('activeStudents', '450+'),
  ('teachersCount', '30+'),
  ('narcoticsFree', '100%')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 6. SEED ABOUT CONTENT (about_content)
INSERT INTO about_content (history, vision, mission, values) VALUES
  (
    'Didirikan dengan cita-cita mulia untuk menghadirkan mercusuar pendidikan keislaman yang komprehensif di Kabupaten Tana Tidung, Kalimantan Utara. Pondok Pesantren Khairaat mendedikasikan diri untuk membimbing tunas bangsa agar memiliki kepekaan spiritual Ahlussunnah wal Jama''ah.',
    'Menjadi lembaga pendidikan Islam unggulan dalam melahirkan generasi Qur''ani yang shalih, cerdas, mandiri, berakhlak mulia, serta siap berkhidmat untuk agama, bangsa, dan negara.',
    '["Menyelenggarakan pendidikan formal & non-formal berkualitas", "Mendidik hafalan Al-Qur''an secara benar", "Menerapkan kurikulum kemandirian life skills"]'::jsonb,
    '[{"title": "Integritas", "desc": "Kejujuran dan etika moral"}, {"title": "Kemandirian", "desc": "Kreatif dan solutif"}, {"title": "Kedisiplinan", "desc": "Taat aturan ibadah dan KBM"}, {"title": "Khidmat", "desc": "Tulus mengabdi untuk ummat"}]'::jsonb
  );

-- 7. SEED DUMMY STUDENTS (Terenkripsi)
-- Menggunakan kunci enkripsi 'super-secret-khairaat-key'
INSERT INTO students (nisn, nis, name, class_id, academic_year_id, guardian_name, guardian_phone, guardian_phone_last4, address, status, spp_amount) VALUES
  (
    '1234567890',
    '2026001',
    'Ahmad Fauzan',
    '22222222-3333-4444-5555-666666666666', -- VII A (SMP)
    'f67a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c', -- 2026/2027
    'Bapak Rahman',
    pgp_sym_encrypt('081234567890', 'super-secret-khairaat-key'),
    '7890',
    'Jl. Jenderal Sudirman, Tideng Pale, Tana Tidung, Kaltara',
    'active',
    500000
  ),
  (
    '0987654321',
    '2026002',
    'Aisyah Zahira',
    '44444444-5555-6666-7777-888888888888', -- X IPA (SMA)
    'f67a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c', -- 2026/2027
    'Bapak Abdullah',
    pgp_sym_encrypt('085678901234', 'super-secret-khairaat-key'),
    '1234',
    'Jl. Perintis, Sebawang, Tana Tidung, Kaltara',
    'active',
    500000
  )
ON CONFLICT (nisn) DO NOTHING;

-- 8. SEED DUMMY BILLS (Tagihan SPP)
-- Pastikan ID santri ada. Karena ID santri UUID acak, seeder ini mencocokkan berdasarkan NISN
INSERT INTO spp_bills (student_id, month, year, amount, paid_amount, status, due_date)
SELECT id, 'Juli', 2026, 500000, 0, 'unpaid', '2026-07-10' FROM students WHERE nisn = '1234567890'
ON CONFLICT (student_id, month, year) DO NOTHING;

INSERT INTO spp_bills (student_id, month, year, amount, paid_amount, status, due_date)
SELECT id, 'Juli', 2026, 500000, 0, 'unpaid', '2026-07-10' FROM students WHERE nisn = '0987654321'
ON CONFLICT (student_id, month, year) DO NOTHING;


-- =============================================================================
-- INTRUKSI CARA MENGHUBUNGKAN ADMIN (LOG IN):
-- =============================================================================
-- 1. Buat user admin baru melalui Supabase Auth Dashboard (gunakan Email & Password).
-- 2. Dapatkan UUID User tersebut dari menu auth.users di dashboard Supabase.
-- 3. Jalankan query SQL di bawah ini (ganti '<USER-UUID>' dengan UUID asli Anda):
--
-- INSERT INTO user_roles (user_id, role_id)
-- VALUES ('<USER-UUID>', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'); -- super_admin role
-- =============================================================================
