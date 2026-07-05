<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Al-Khairaat Tana Tidung Portal

Sistem pembayaran SPP dan katering untuk Pondok Pesantren Al-Khairaat Tana Tidung (SMP-SMA).

## Ringkasan

Aplikasi ini menyediakan portal terintegrasi untuk:
- Wali santri: melihat tagihan dan mengirim konfirmasi pembayaran
- Admin: mengelola data santri, tagihan SPP, validasi pembayaran, serta pencatatan keuangan katering
- Laporan: rekap bulanan dan tahunan pembayaran SPP, serta laporan keuangan katering bulanan

## Fitur Utama

- Portal akses publik untuk memilih peran pengguna
- Portal wali santri untuk melihat tagihan dan mengirim bukti pembayaran
- Login admin berbasis Supabase Auth
- Manajemen data santri
- Pembuatan tagihan SPP massal berdasarkan bulan, tahun, jenjang, dan kelas
- Pencatatan pembayaran tunai dan transfer
- Validasi manual pembayaran oleh admin
- Laporan SPP bulanan
- Laporan SPP tahunan per santri
- Manajemen keuangan katering / meal finance
- Laporan katering bulanan

## Teknologi

- React 19
- TypeScript
- Vite
- Supabase
- Tailwind CSS 4
- Lucide React
- Motion
- Express
- dotenv
- @google/genai

## Prasyarat

- Node.js 18+ dan npm
- Project Supabase dengan tabel dan fungsi RPC yang sesuai
- Environment variable `GEMINI_API_KEY` jika fitur terkait Gemini digunakan

## Instalasi

1. Clone repository ini
2. Install dependensi:
   ```bash
   npm install
   ```
3. Siapkan file environment bila diperlukan, misalnya:
   ```bash
   # .env.local
   GEMINI_API_KEY=your_gemini_api_key
   ```
4. Pastikan konfigurasi Supabase tersedia di `src/lib/supabase`

## Menjalankan Aplikasi

Jalankan mode development:

```bash
npm run dev
```

Aplikasi akan berjalan di:

```bash
http://localhost:3000
```

## Script Tersedia

- `npm run dev` - menjalankan Vite dev server di port 3000
- `npm run build` - membangun aplikasi untuk produksi
- `npm run preview` - menjalankan hasil build secara lokal
- `npm run lint` - menjalankan pemeriksaan TypeScript
- `npm run clean` - menghapus folder build dan server output

## Struktur Singkat

- `src/components` - komponen UI dan layout
- `src/pages` - halaman portal wali dan admin
- `src/lib` - konfigurasi integrasi eksternal
- `src/types` - definisi tipe data
- `src/utils` - fungsi utilitas
- `supabase/schema.sql` - skema database Supabase

## Konfigurasi Supabase

Aplikasi ini menggunakan Supabase untuk:
- autentikasi admin
- penyimpanan data santri
- tagihan SPP
- pembayaran dan validasi pembayaran
- data keuangan katering
- penyimpanan bukti pembayaran

Pastikan tabel, storage bucket, dan RPC berikut tersedia sesuai implementasi aplikasi:
- `students`
- `spp_bills`
- `installments`
- `payments`
- `meal_finance`
- RPC `submit_payment`
- RPC `approve_payment`
- RPC `reject_payment`

## Catatan

- Pastikan kredensial Supabase dan environment variable sudah dikonfigurasi sebelum menjalankan aplikasi
- Bukti pembayaran dapat diunggah sebagai file gambar atau data base64
- Data yang tampil di dashboard bergantung pada koneksi dan konfigurasi Supabase