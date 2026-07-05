# Security Audit Report: Al-Khairaat Tana Tidung Portal

Tanggal audit: 2026-07-06  
Scope: React/Vite frontend, Supabase client integration, Supabase schema/RLS/storage policies, payment/receipt flow, dependency audit.

## Ringkasan Eksekutif

Aplikasi sudah menggunakan Supabase Auth untuk login admin dan Supabase sebagai backend data. Namun konfigurasi keamanan database dan storage saat ini masih terlalu permisif untuk data pendidikan/keuangan yang sensitif. Temuan paling kritis adalah kebijakan RLS yang mengizinkan role `anon` membaca seluruh data santri, tagihan, cicilan, dan pembayaran, serta mengizinkan upload bukti bayar ke bucket publik tanpa pembatasan tipe/ukuran file yang memadai.

Secara praktis, siapa pun yang memiliki Supabase URL dan anon key dari bundle frontend dapat melakukan query langsung ke tabel yang diizinkan oleh RLS, tanpa perlu melalui UI aplikasi. Karena anon key memang bersifat publik di aplikasi frontend, keamanan harus ditegakkan di RLS, RPC, dan storage policy, bukan di sisi React saja.

## Metodologi Singkat

Pemeriksaan dilakukan dengan:
- Review `package.json` dan menjalankan `npm audit --omit=dev`.
- Review integrasi Supabase di `src/lib/supabase.ts`.
- Review auth/routing/data access di `src/App.tsx`.
- Review login admin di `src/pages/admin/AdminLoginPage.tsx`.
- Review portal wali di `src/pages/guardian/GuardianPortalPage.tsx`.
- Review generator PDF yang menggunakan `innerHTML` di `src/pages/guardian/GuardianYearlyReport.tsx`.
- Review schema, RLS, RPC, dan storage policy di `supabase/schema.sql`.

## Temuan Prioritas Tinggi

### 1. RLS anon mengizinkan pembacaan seluruh data santri dan transaksi

**Lokasi:** `supabase/schema.sql` baris 84-89

Policy saat ini:

```sql
CREATE POLICY "Anon can view all students" ON students FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can view bills" ON spp_bills FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can view installments" ON installments FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert payments" ON payments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can view payments" ON payments FOR SELECT TO anon USING (true);
```

**Risiko: Kritis**

Data berikut dapat diekspos ke publik melalui Supabase REST/JS client:
- NISN/NIS.
- Nama santri.
- Nama wali.
- Nomor telepon wali.
- Alamat.
- Nominal tagihan.
- Status pembayaran.
- Riwayat cicilan.
- Data pembayaran, rekening, dan URL bukti bayar.

Karena frontend menggunakan:

```ts
supabase.from('students').select('*')
supabase.from('spp_bills').select('*')
supabase.from('installments').select('*')
supabase.from('payments').select('*')
```

dan policy anon mengizinkan SELECT semua baris, data bisa diambil tanpa login admin.

**Rekomendasi:**
- Cabut policy anon SELECT global dari `students`, `spp_bills`, `installments`, dan `payments`.
- Jangan memuat seluruh dataset santri ke browser publik.
- Buat RPC khusus untuk portal wali yang hanya mengembalikan data satu santri setelah verifikasi.
- Tambahkan faktor verifikasi tambahan selain NISN/NIS, misalnya kombinasi NISN + tanggal lahir, token wali, atau OTP WhatsApp.
- Untuk data admin, gunakan policy `authenticated` yang lebih ketat dan idealnya role/claim admin, bukan semua user authenticated.

Contoh arah perbaikan:

```sql
DROP POLICY IF EXISTS "Anon can view all students" ON students;
DROP POLICY IF EXISTS "Anon can view bills" ON spp_bills;
DROP POLICY IF EXISTS "Anon can view installments" ON installments;
DROP POLICY IF EXISTS "Anon can view payments" ON payments;
```

Lalu sediakan RPC `guardian_lookup(...)` dengan validasi input dan hanya return kolom yang perlu.

---

### 2. Policy `authenticated` memberi akses admin penuh ke semua user login

**Lokasi:** `supabase/schema.sql` baris 91-96

Policy saat ini:

```sql
CREATE POLICY "Admin full access students" ON students TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access bills" ON spp_bills TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access installments" ON installments TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access payments" ON payments TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access meal_finance" ON meal_finance TO authenticated USING (true) WITH CHECK (true);
```

**Risiko: Tinggi**

Semua akun Supabase Auth yang berhasil login dianggap admin penuh. Jika ada user non-admin, akun testing, akun yang tidak sengaja dibuat, atau login pihak lain, mereka mendapat akses penuh CRUD ke data sensitif.

**Rekomendasi:**
- Tambahkan tabel/claim role admin.
- Policy harus memeriksa role, bukan hanya `authenticated`.

Contoh:

```sql
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin'))
);

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
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

CREATE POLICY "Only admins can manage students"
ON students
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());
```

---

### 3. RPC approval/rejection pembayaran tidak membatasi role admin

**Lokasi:** `supabase/schema.sql` baris 122-182, `src/App.tsx` baris 182-202

RPC:
- `approve_payment(p_payment_id TEXT)`
- `reject_payment(p_payment_id TEXT, p_reason TEXT)`

**Risiko: Tinggi**

Jika RPC tersedia untuk role yang tidak semestinya, user dapat memanggil fungsi validasi pembayaran langsung. Selain itu, fungsi tidak memverifikasi bahwa caller adalah admin.

**Rekomendasi:**
- Revoke execute dari `anon`.
- Grant hanya ke `authenticated`.
- Tambahkan pengecekan `is_admin()` di awal fungsi.
- Gunakan `SECURITY DEFINER` secara hati-hati dengan `SET search_path`.

Contoh:

```sql
REVOKE EXECUTE ON FUNCTION approve_payment(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION reject_payment(TEXT, TEXT) FROM anon;

GRANT EXECUTE ON FUNCTION approve_payment(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_payment(TEXT, TEXT) TO authenticated;
```

Di dalam fungsi:

```sql
IF NOT is_admin() THEN
  RAISE EXCEPTION 'not authorized';
END IF;
```

---

### 4. Bucket receipt publik dan upload anon terlalu terbuka

**Lokasi:** `supabase/schema.sql` baris 184-191, `src/App.tsx` baris 132-152

Bucket:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true);
```

Policy:

```sql
CREATE POLICY "Public can view receipts" ON storage.objects FOR SELECT TO public USING (bucket_id = 'receipts');
CREATE POLICY "Anon can upload receipts" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'receipts');
```

**Risiko: Tinggi**

Masalah:
- Semua bukti pembayaran bersifat publik.
- Anon dapat upload ke bucket.
- Tidak ada pembatasan MIME type dalam policy.
- Tidak ada pembatasan path berbasis identitas/sesi.
- Nama file hanya `receipt-${Date.now()}.jpg`, rentan collision dan mudah ditebak.
- Client selalu mengirim `contentType: 'image/jpeg'` walaupun file asli belum tentu JPEG.
- Tidak ada validasi ukuran file di kode yang terlihat.

**Rekomendasi:**
- Jadikan bucket private.
- Gunakan signed URL untuk admin/guardian yang berhak.
- Batasi upload hanya image yang valid dan ukuran tertentu.
- Gunakan nama object random UUID.
- Simpan metadata pembayaran dan object path, bukan URL publik permanen.
- Pertimbangkan upload melalui Edge Function/server yang melakukan validasi file.

Contoh arah konfigurasi:

```sql
UPDATE storage.buckets
SET public = false
WHERE id = 'receipts';

DROP POLICY IF EXISTS "Public can view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Anon can upload receipts" ON storage.objects;
```

---

### 5. Fungsi `submit_payment` mengizinkan input pembayaran tanpa validasi bisnis memadai

**Lokasi:** `supabase/schema.sql` baris 98-120, `src/App.tsx` baris 160-172

**Risiko: Tinggi**

Fungsi menerima `student_id`, `bill_id`, `amount`, tanggal, rekening, dan receipt URL dari client. Saat ini tidak tampak validasi bahwa:
- `bill_id` benar milik `student_id`.
- Bill belum lunas.
- Amount positif.
- Amount tidak melebihi sisa tagihan.
- Method valid di level fungsi.
- Receipt berasal dari bucket/path yang sah.
- Submitter memang wali yang berhak atas santri tersebut.

**Rekomendasi:**
- Validasi seluruh aturan bisnis di database/RPC, bukan hanya UI.
- Tambahkan `CHECK (amount > 0)` pada tabel terkait.
- Di RPC, ambil nominal dan status bill dari database, jangan percaya nominal penuh dari client.
- Lock row bill saat transaksi untuk mencegah race condition:

```sql
SELECT * FROM spp_bills
WHERE id = p_bill_id
FOR UPDATE;
```

---

## Temuan Prioritas Sedang

### 6. Guardian portal hanya menggunakan NISN/NIS sebagai autentikasi praktis

**Lokasi:** `src/pages/guardian/GuardianPortalPage.tsx` baris 53-71

Pencarian wali:

```ts
const found = students.find((s) => {
  const matchId = s.nisn === identifier || s.nis === identifier;
  const matchYear = !s.academicYear || s.academicYear === academicYear;
  return matchId && matchYear && s.status === 'active';
});
```

**Risiko: Sedang-Tinggi**

NISN/NIS bukan secret. Jika diketahui atau ditebak, data tagihan dan profil santri dapat dilihat.

**Rekomendasi:**
- Gunakan verifikasi tambahan: tanggal lahir, kode wali, OTP, atau login wali.
- Jangan preload semua santri di browser.
- Implementasikan rate limit pada lookup.
- Return hanya data minimal yang diperlukan.

---

### 7. Data fetching frontend mengambil semua kolom dan semua baris

**Lokasi:** `src/App.tsx` baris 67-82

**Risiko: Sedang**

Query `select('*')` memperbesar dampak kebocoran dan exposure data.

**Rekomendasi:**
- Pilih kolom eksplisit.
- Pisahkan endpoint/queries admin dan guardian.
- Untuk guardian, fetch hanya setelah lookup berhasil dan hanya data milik santri terkait.
- Untuk admin, fetch setelah session/role admin tervalidasi.

---

### 8. Potensi XSS/HTML injection pada generator PDF berbasis `innerHTML`

**Lokasi:** `src/pages/guardian/GuardianYearlyReport.tsx` baris 55-330 dan hasil search juga menunjukkan pola serupa di `MonthlySppReportPage.tsx`.

Kode membuat string HTML lalu memasukkannya dengan:

```ts
element.innerHTML = htmlContent;
```

**Risiko: Sedang**

Saat ini sebagian besar data yang dimasukkan adalah bulan, tahun, status, nominal. Namun jika ada field yang berasal dari database/user input dan dimasukkan ke template HTML tanpa escaping, akan muncul risiko XSS/HTML injection.

**Rekomendasi:**
- Hindari `innerHTML` untuk data dinamis.
- Jika tetap memakai HTML string untuk PDF, escape semua nilai dinamis.
- Buat helper `escapeHtml()` dan terapkan pada semua string yang berasal dari database/user input.
- Pastikan laporan admin seperti `MonthlySppReportPage.tsx` juga diperiksa karena ditemukan penggunaan `innerHTML`.

Contoh helper:

```ts
const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replaceAll('&', '&')
    .replaceAll('<', '<')
    .replaceAll('>', '>')
    .replaceAll('"', '"')
    .replaceAll("'", '&#039;');
```

Implementasikan helper escaping ini pada setiap nilai dinamis yang dimasukkan ke HTML string, terutama nilai dari database atau input pengguna.

---

### 9. Tidak ada security headers/CSP yang terlihat

**Lokasi:** `index.html`, konfigurasi deployment belum terlihat.

**Risiko: Sedang**

Aplikasi SPA tanpa Content Security Policy lebih rentan jika suatu titik XSS ditemukan.

**Rekomendasi:**
- Tambahkan security headers di hosting/reverse proxy:
  - `Content-Security-Policy`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`
  - `Frame-Options` atau `frame-ancestors`
- Untuk Vite static hosting, set headers di platform deploy (Netlify/Vercel/Nginx/Cloudflare).

Contoh CSP awal yang perlu disesuaikan dengan Supabase domain:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co; object-src 'none'; base-uri 'self'; frame-ancestors 'none';
```

---

## Temuan Dependency

### 10. `xlsx` memiliki vulnerability high dan tidak ada fix tersedia

**Perintah:** `npm audit --omit=dev`

Hasil:

```text
xlsx  *
Severity: high
Prototype Pollution in sheetJS - GHSA-4r6h-8v6p-xvw6
SheetJS Regular Expression Denial of Service (ReDoS) - GHSA-5pgg-2g8v-p4x9
No fix available
```

**Risiko: Tinggi jika memproses file Excel tidak tepercaya; Sedang jika hanya export data internal.**

**Rekomendasi:**
- Jika aplikasi mengimpor file Excel dari user, hentikan penggunaan `xlsx` untuk input tidak tepercaya.
- Evaluasi alternatif seperti ExcelJS untuk kebutuhan tertentu.
- Jika hanya export sederhana, pertimbangkan CSV manual atau library lain.
- Batasi ukuran file dan jalankan parsing di server sandbox bila tetap diperlukan.
- Dokumentasikan bahwa file dari pihak tidak tepercaya tidak boleh diproses dengan `xlsx`.

---

## Observasi Positif

- Admin login sudah menggunakan Supabase Auth, bukan hardcoded credential di kode terbaru.
- RLS sudah diaktifkan pada tabel utama.
- React secara default melakukan escaping pada render JSX biasa.
- Tidak ditemukan penggunaan `dangerouslySetInnerHTML`.
- Payment approval/rejection dilakukan melalui RPC sehingga bisa dipusatkan di database setelah policy diperketat.
- Soft delete santri menjaga audit trail historis.

## Rekomendasi Remediasi Berurutan

### Fase 1 - Segera / Kritikal
1. Cabut anon SELECT global dari tabel sensitif.
2. Cabut anon SELECT pada `payments`.
3. Jadikan bucket `receipts` private.
4. Batasi RPC admin (`approve_payment`, `reject_payment`) hanya untuk admin role.
5. Tambahkan role-based policy, bukan sekadar `TO authenticated USING (true)`.

### Fase 2 - Perbaikan Arsitektur Akses Wali
1. Buat RPC `guardian_lookup` yang tidak membocorkan seluruh dataset.
2. Tambahkan verifikasi wali tambahan selain NISN/NIS.
3. Tambahkan rate limiting melalui Edge Function/API layer untuk lookup publik.
4. Return kolom minimal untuk portal wali.

### Fase 3 - Hardening Input/Storage
1. Validasi amount, bill ownership, bill status, dan sisa tagihan di RPC.
2. Tambahkan constraints `amount > 0`.
3. Gunakan object name random UUID untuk receipt.
4. Validasi MIME dan ukuran file.
5. Escape seluruh data dinamis dalam PDF HTML.

### Fase 4 - Deployment & Supply Chain
1. Tambahkan CSP dan security headers.
2. Review penggunaan `xlsx` dan migrasi bila diperlukan.
3. Jalankan `npm audit` rutin di CI.
4. Tambahkan logging/audit trail untuk operasi admin penting.

## Contoh Checklist SQL Remediasi Awal

```sql
-- 1. Remove public read policies
DROP POLICY IF EXISTS "Anon can view all students" ON students;
DROP POLICY IF EXISTS "Anon can view bills" ON spp_bills;
DROP POLICY IF EXISTS "Anon can view installments" ON installments;
DROP POLICY IF EXISTS "Anon can view payments" ON payments;

-- 2. Remove public storage access
DROP POLICY IF EXISTS "Public can view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Anon can upload receipts" ON storage.objects;

UPDATE storage.buckets
SET public = false
WHERE id = 'receipts';

-- 3. Restrict sensitive RPC execution
REVOKE EXECUTE ON FUNCTION approve_payment(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION reject_payment(TEXT, TEXT) FROM anon;
```

Catatan: SQL di atas adalah baseline hardening. Sebelum diterapkan ke produksi, siapkan policy/RPC pengganti agar fitur guardian dan admin tetap berjalan.

## Kesimpulan

Status keamanan saat ini belum siap untuk produksi dengan data santri dan transaksi nyata. Risiko terbesar bukan pada React UI, melainkan pada boundary backend: RLS Supabase, policy storage, dan RPC authorization. Prioritas utama adalah mengubah model akses dari "anon dapat membaca semua data lalu UI memfilter" menjadi "backend hanya mengembalikan data yang memang berhak diakses". Setelah itu, lakukan hardening upload receipt, validasi bisnis pembayaran di database, security headers, dan mitigasi dependency `xlsx`.