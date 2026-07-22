# Dokumentasi Skema Database & CMS Portal Wali Santri

## Fitur Utama Database
1. **CMS Website Dinamis:** Pengelolaan data landing page langsung dari database, tanpa perlu deploy ulang kode front-end.
2. **Enkripsi Data Sensitif:** Kolom `guardian_phone` dan `account_number` dienkripsi dengan `pgp_sym_encrypt` menggunakan kunci rahasia yang disimpan di Vault/secret manager. Pembacaan hanya melalui fungsi `SECURITY DEFINER` yang membatasi siapa yang boleh memanggil `pgp_sym_decrypt`.
3. **Keamanan RLS & Admin:** Semua akses publik non-CMS ditutup (`ENABLE ROW LEVEL SECURITY` + tidak ada policy `PUBLIC`). Query data santri oleh wali menggunakan RPC pencocokan ganda (NISN + nomor HP wali/tanggal lahir), bukan akses tabel langsung.
4. **Jejak Audit:** Perubahan status pembayaran tercatat di `payment_audit_log`; perubahan konten CMS memiliki kolom `updated_by` agar bisa ditelusuri.

---

## Relasi Tabel (ERD Ringkas)

```
students (1) ── (N) spp_bills
spp_bills (1) ── (N) installments        -- riwayat cicilan/pelunasan riil per tagihan
spp_bills (1) ── (N) payments            -- pengajuan konfirmasi transfer per tagihan (bisa lebih dari 1 percobaan)
payments (1) ── (0..1) installments      -- saat payment di-approve, 1 installment dibuat (via trigger/RPC)
students (1) ── (N) payments
students (1) ── (N) meal_finance         -- opsional, hanya saat type = 'income' (iuran katering)
auth.users (1) ── (1) user_roles
user_roles (N) ── (1) roles
roles (N) ── (N) permissions          -- lewat role_permissions
auth.users (1) ── (N) payment_audit_log
payments (1) ── (N) payment_audit_log
programs_data (1) ── (N) ppdb_registrations
ppdb_registrations (1) ── (0..1) students   -- setelah status 'accepted' → 'enrolled'
custom_fields (1) ── (N) custom_field_values
media_library (1) ── (N) news_articles / gallery_items / hero_banners   -- direferensikan via URL, bukan FK ketat
```

---

## Daftar Tabel & Kolom

### 1. `site_config` (CMS Konfigurasi Situs)
Menyimpan konfigurasi key-value untuk data global situs.
* `key` (TEXT, PK): Kode unik konfigurasi.
* `value` (TEXT): Nilai konfigurasi.
* `updated_at` (TIMESTAMPTZ): Waktu pembaruan.
* `updated_by` (UUID, FK `auth.users`): Admin yang terakhir mengubah.

### 2. `about_content` (CMS Profil & Visi Misi)
* `id` (UUID, PK): ID konten.
* `history` (TEXT): Sejarah singkat pesantren.
* `vision` (TEXT): Visi pesantren.
* `mission` (JSONB): Misi pesantren (array string).
* `values` (JSONB): Nilai-nilai dasar (array object `{title, description}`).
* `updated_at` (TIMESTAMPTZ): Waktu pembaruan.
* `updated_by` (UUID, FK `auth.users`).

### 3. `news_articles` (CMS Berita & Pengumuman)
* `id` (UUID, PK): ID artikel.
* `title` (TEXT): Judul artikel.
* `slug` (TEXT, Unique, NOT NULL): Slug URL berita.
* `content` (TEXT): Konten berita.
* `image_url` (TEXT): Gambar cover berita.
* `category` (TEXT): Kategori berita.
* `status` (TEXT, default `'published'`): `'draft'` / `'published'`.
* `created_at` (TIMESTAMPTZ)
* `updated_at` (TIMESTAMPTZ)
* `created_by` / `updated_by` (UUID, FK `auth.users`).

### 4. `gallery_items` (CMS Galeri Foto)
* `id` (UUID, PK)
* `title` (TEXT)
* `image_url` (TEXT, NOT NULL)
* `category` (TEXT)
* `sort_order` (INTEGER, default 0)
* `created_at` (TIMESTAMPTZ)
* `created_by` (UUID, FK `auth.users`).

### 5. `programs_data` (CMS Program Pendidikan)
* `id` (UUID, PK)
* `title` (TEXT)
* `description` (TEXT)
* `icon` (TEXT)
* `sort_order` (INTEGER, default 0)
* `created_at` (TIMESTAMPTZ)

### 5b. `academic_years` (Tabel Master Tahun Ajaran)
* `id` (UUID, PK)
* `name` (TEXT, Unique, NOT NULL): Contoh: `'2025/2026'`, `'2026/2027'`.
* `is_active` (BOOLEAN, default false): Hanya ada 1 tahun ajaran aktif.
* `created_at` (TIMESTAMPTZ)

### 5c. `classes` (Tabel Master Kelas)
* `id` (UUID, PK)
* `name` (TEXT, Unique, NOT NULL): Contoh: `'10-A SMA'`, `'7-B SMP'`.
* `level` (TEXT, CHECK IN `('SMP', 'SMA')`): Jenjang pendidikan.
* `created_at` (TIMESTAMPTZ)

### 6a. `roles` (Master Peran)
* `id` (UUID, PK)
* `name` (TEXT, Unique): contoh `'super_admin'`, `'admin'`, `'bendahara'`, `'staf_dapur'`, `'editor_konten'`.
* `description` (TEXT)
* `created_at` (TIMESTAMPTZ)

### 6b. `permissions` (Master Izin/Aksi)
* `id` (UUID, PK)
* `code` (TEXT, Unique): contoh `'news.create'`, `'news.publish'`, `'payment.approve'`, `'ppdb.review'`, `'settings.edit'`.
* `description` (TEXT)
* `module` (TEXT): pengelompokan menu, contoh `'Artikel & Berita'`, `'Kelola SPMB'`, `'Pengaturan Web'`.

### 6c. `role_permissions` (Pivot Peran ↔ Izin)
* `role_id` (UUID, FK `roles`, PK bagian 1)
* `permission_id` (UUID, FK `permissions`, PK bagian 2)
* PRIMARY KEY (`role_id`, `permission_id`)

### 6d. `user_roles` (Otorisasi Staf/Admin)
* `user_id` (UUID, PK, FK `auth.users`)
* `role_id` (UUID, FK `roles`, NOT NULL)
* `created_at` (TIMESTAMPTZ)
* `created_by` (UUID, FK `auth.users`, NULLABLE)

### 7. `students` (Profil Santri)
* `id` (UUID, PK)
* `nisn` (TEXT, Unique, CHECK panjang = 10 digit)
* `nis` (TEXT, Unique)
* `name` (TEXT, NOT NULL)
* `class_id` (UUID, FK `classes`, ON DELETE RESTRICT) -- Relasi ke tabel master Kelas
* `academic_year_id` (UUID, FK `academic_years`, ON DELETE RESTRICT) -- Relasi ke tabel master Tahun Ajaran
* `guardian_name` (TEXT)
* `guardian_phone` (BYTEA) -- terenkripsi via `pgp_sym_encrypt`
* `guardian_phone_last4` (TEXT) -- 4 digit terakhir nomor telepon untuk lookup cepat
* `address` (TEXT)
* `status` (TEXT, CHECK IN `('active', 'graduated', 'inactive')`)
* `spp_amount` (NUMERIC, NOT NULL, CHECK >= 0)

### 8. `spp_bills` (Tagihan SPP Bulanan)
* `id` (UUID, PK)
* `student_id` (UUID, FK `students`, ON DELETE RESTRICT)
* `month` (TEXT)
* `year` (INTEGER)
* `amount` (NUMERIC, NOT NULL)
* `paid_amount` (NUMERIC, default 0)
* `status` (TEXT, CHECK IN `('unpaid', 'partial', 'paid', 'overdue')`)
* `due_date` (DATE)
* UNIQUE (`student_id`, `month`, `year`)

### 9. `installments` (Riwayat Transaksi Riil / Pelunasan)
* `id` (UUID, PK)
* `bill_id` (UUID, FK `spp_bills`, ON DELETE RESTRICT)
* `payment_id` (UUID, FK `payments`, NULLABLE)
* `amount` (NUMERIC, NOT NULL, CHECK > 0)
* `payment_date` (DATE)
* `reference_number` (TEXT, Unique)
* `method` (TEXT, CHECK IN `('transfer', 'cash')`)
* `recorded_by` (UUID, FK `auth.users`)

### 10. `payments` (Konfirmasi Pembayaran Manual dari Wali)
* `id` (UUID, PK)
* `student_id` (UUID, FK `students`)
* `bill_id` (UUID, FK `spp_bills`)
* `amount` (NUMERIC, NOT NULL)
* `payment_date` (DATE)
* `method` (TEXT, CHECK IN `('transfer', 'cash')`)
* `bank_name` (TEXT)
* `account_number` (BYTEA) -- terenkripsi
* `account_name` (TEXT)
* `receipt_image` (TEXT)
* `status` (TEXT, CHECK IN `('pending_validation', 'approved', 'rejected')`)
* `reference_number` (TEXT, Unique)
* `notes` (TEXT)
* `reviewed_by` (UUID, FK `auth.users`, NULLABLE)
* `reviewed_at` (TIMESTAMPTZ, NULLABLE)

### 11. `meal_finance` (Kas Belanja Katering Dapur)
* `id` (UUID, PK)
* `type` (TEXT, CHECK IN `('income', 'expense')`)
* `category` (TEXT)
* `amount` (NUMERIC, NOT NULL, CHECK > 0)
* `date` (DATE)
* `description` (TEXT)
* `student_id` (UUID, FK `students`, NULLABLE)
* `status` (TEXT, CHECK IN `('completed', 'pending')`)
* `receipt_image` (TEXT)
* `recorded_by` (UUID, FK `auth.users`)
* `item_name` (TEXT, NULLABLE)
* `quantity` (NUMERIC, NULLABLE)
* `unit` (TEXT, NULLABLE)
* `price_per_unit` (NUMERIC, NULLABLE)
* `supplier_name` (TEXT, NULLABLE)
* CHECK (`quantity IS NULL OR amount = quantity * price_per_unit`)

### 12. `payment_audit_log` (Log Audit Bendahara)
* `id` (BIGSERIAL, PK)
* `payment_id` (UUID, FK `payments`, ON DELETE RESTRICT)
* `action` (TEXT, CHECK IN `('submit', 'approve', 'reject', 'resubmit')`)
* `old_status` (TEXT)
* `new_status` (TEXT)
* `reason` (TEXT)
* `performed_by` (UUID, FK `auth.users`)
* `performed_at` (TIMESTAMPTZ, default `now()`)

### 13. `pages` (Page Builder)
* `id` (UUID, PK)
* `slug` (TEXT, Unique, NOT NULL)
* `title` (TEXT, NOT NULL)
* `sections` (JSONB) -- array of page sections
* `status` (TEXT, CHECK IN `('draft', 'published')`)
* `created_at`, `updated_at` (TIMESTAMPTZ)
* `updated_by` (UUID, FK `auth.users`)

### 14. `nav_menus` (Menu Navigasi)
* `id` (UUID, PK)
* `label` (TEXT, NOT NULL)
* `url` (TEXT)
* `parent_id` (UUID, FK `nav_menus`, NULLABLE)
* `location` (TEXT, CHECK IN `('header', 'footer')`)
* `sort_order` (INTEGER, default 0)
* `is_active` (BOOLEAN, default true)

### 15. `media_library` (Media Library / Katalog Media)
* `id` (UUID, PK)
* `file_name` (TEXT, NOT NULL)
* `file_url` (TEXT, NOT NULL)
* `file_type` (TEXT, CHECK IN `('image', 'video', 'document')`)
* `file_size` (INTEGER)
* `category` (TEXT, NOT NULL DEFAULT 'Umum') -- Kategori Media (misal: 'Berita', 'Galeri', 'Banner', 'Dokumen')
* `alt_text` (TEXT, NULLABLE)
* `uploaded_by` (UUID, FK `auth.users`)
* `created_at` (TIMESTAMPTZ)

### 16. `custom_fields` (Definisi Custom Field)
* `id` (UUID, PK)
* `entity_type` (TEXT, NOT NULL): `'news_articles'`, `'programs_data'`.
* `field_key` (TEXT, NOT NULL)
* `field_label` (TEXT, NOT NULL)
* `field_type` (TEXT, CHECK IN `('text', 'number', 'date', 'select', 'textarea', 'boolean')`)
* `options` (JSONB, NULLABLE)
* `is_required` (BOOLEAN, default false)
* `sort_order` (INTEGER, default 0)
* UNIQUE (`entity_type`, `field_key`)

### 17. `custom_field_values` (Nilai Custom Field)
* `id` (UUID, PK)
* `custom_field_id` (UUID, FK `custom_fields`)
* `entity_id` (UUID, NOT NULL)
* `value` (TEXT)

### 18. `faqs` (Kelola FAQ)
* `id` (UUID, PK)
* `question` (TEXT, NOT NULL)
* `answer` (TEXT, NOT NULL)
* `category` (TEXT, NULLABLE)
* `sort_order` (INTEGER, default 0)
* `is_active` (BOOLEAN, default true)
* `created_at`, `updated_at` (TIMESTAMPTZ)

### 19. `hero_banners` (Hero Banner)
* `id` (UUID, PK)
* `title` (TEXT)
* `subtitle` (TEXT, NULLABLE)
* `image_url` (TEXT, NOT NULL)
* `cta_text` (TEXT, NULLABLE)
* `cta_url` (TEXT, NULLABLE)
* `sort_order` (INTEGER, default 0)
* `is_active` (BOOLEAN, default true)
* `start_date`, `end_date` (DATE, NULLABLE)

### 20. `ppdb_registrations` (Master Pendaftaran PPDB/SPMB)
* `id` (UUID, PK)
* `registration_number` (TEXT, Unique, NOT NULL)
* `full_name` (TEXT, NOT NULL)
* `birth_place` (TEXT)
* `birth_date` (DATE)
* `gender` (TEXT, CHECK IN `('L', 'P')`)
* `address` (TEXT)
* `previous_school` (TEXT)
* `program_id` (UUID, FK `programs_data`, NULLABLE) -- Jurusan/Pilihan Tahfidz
* `created_at` (TIMESTAMPTZ)

### 20b. `ppdb_parents` (Data Orang Tua / Wali Calon Santri PPDB)
* `id` (UUID, PK)
* `registration_id` (UUID, FK `ppdb_registrations`, ON DELETE CASCADE)
* `father_name` (TEXT)
* `father_occupation` (TEXT)
* `mother_name` (TEXT)
* `mother_occupation` (TEXT)
* `parent_phone` (BYTEA) -- terenkripsi
* `guardian_name` (TEXT, NULLABLE)

### 20c. `ppdb_documents` (Berkas Upload Calon Santri PPDB)
* `id` (UUID, PK)
* `registration_id` (UUID, FK `ppdb_registrations`, ON DELETE CASCADE)
* `document_type` (TEXT, CHECK IN `('kk', 'akte', 'ijazah', 'rapor', 'foto')`)
* `file_url` (TEXT, NOT NULL)
* `created_at` (TIMESTAMPTZ)

### 20d. `ppdb_reviews` (Log Validasi Staf PPDB)
* `id` (UUID, PK)
* `registration_id` (UUID, FK `ppdb_registrations`, ON DELETE CASCADE)
* `status` (TEXT, CHECK IN `('submitted', 'verified', 'accepted', 'rejected', 'enrolled')`)
* `notes` (TEXT)
* `reviewed_by` (UUID, FK `auth.users`)
* `created_at` (TIMESTAMPTZ)

### 21. `seo_meta` (Meta SEO Konten)
* `id` (UUID, PK)
* `entity_type` (TEXT, NOT NULL): `'news_articles'`, `'pages'`, `'programs_data'`, `'global'`.
* `entity_id` (UUID, NULLABLE)
* `meta_title` (TEXT)
* `meta_description` (TEXT)
* `og_image_url` (TEXT)
* `keywords` (TEXT)
* `updated_at` (TIMESTAMPTZ)
* UNIQUE (`entity_type`, `entity_id`)

### 22. `newsletter_subscribers` (Langganan Berita)
* `id` (UUID, PK)
* `email` (TEXT, Unique, NOT NULL)
* `subscribed_at` (TIMESTAMPTZ)
* `is_active` (BOOLEAN, default true)

### 23. `contact_messages` (Formulir Kontak Publik)
* `id` (UUID, PK)
* `name` (TEXT, NOT NULL)
* `email` (TEXT, NOT NULL)
* `phone` (TEXT, NULLABLE)
* `subject` (TEXT)
* `message` (TEXT, NOT NULL)
* `status` (TEXT, CHECK IN `('new', 'read', 'replied')`, default `'new'`)
* `created_at` (TIMESTAMPTZ)
