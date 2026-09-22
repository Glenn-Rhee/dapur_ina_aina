# Dapur Ina Aina

Website pemesanan makanan online untuk Toko Dapur Ina Aina — dibangun sesuai rancangan pada
**Tugas LSP 1** (use case, activity diagram, class diagram, design system) dan
**Tugas LSP 2** (rancangan database).

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (komponen ditulis manual sesuai `globals.css` yang diberikan)
- **Supabase** (PostgreSQL, Auth, Storage) via `@supabase/ssr`
- **Zod** untuk validasi, **Recharts** untuk grafik laporan, **Sonner** untuk notifikasi

## Fitur

**Pelanggan** (route `(customer)`, wajib login): melihat menu & detail, mencari/filter kategori,
keranjang belanja (localStorage, disinkronkan ke stok terbaru), checkout dengan pembayaran
Tunai/Non-tunai, melihat pesanan aktif & riwayat, membatalkan pesanan yang masih menunggu.

**Admin** (route `/admin`, wajib role `ADMIN`): dashboard ringkasan, kelola kategori, kelola menu
(termasuk unggah foto ke Supabase Storage), kelola stok (stok masuk/keluar), kelola transaksi
(ubah status pesanan & pembayaran), laporan penjualan (mingguan/bulanan/tahunan + menu terlaris).

Semua aturan bisnis penting (potong stok, hitung total, validasi status) dijalankan di **database**
lewat PostgreSQL function (`supabase/schema.sql`), dilindungi oleh **Row Level Security**, agar
konsisten dan aman dipanggil langsung dari browser.

## Menjalankan proyek

### 1. Install dependency

```bash
npm install
```

### 2. Siapkan project Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor** → tempel seluruh isi `supabase/schema.sql` → **Run**.
   Script ini membuat semua tabel, function, RLS, bucket foto menu, dan beberapa data menu contoh.
3. Buka **Project Settings → API** (atau tombol **Connect**), salin **Project URL** dan
   **anon / publishable key**.

### 3. Konfigurasi environment

```bash
cp .env.example .env.local
```

Isi `.env.local` dengan URL dan key dari langkah sebelumnya.

### 4. Jalankan aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### 5. Membuat akun admin

1. Daftar akun baru lewat halaman `/register` di aplikasi (akun baru selalu berperan `USER`).
2. Di **SQL Editor** Supabase, jalankan:
   ```sql
   update public.users set role = 'ADMIN' where email = 'email_anda@contoh.com';
   ```
3. Login ulang — Anda akan diarahkan ke `/admin`.

## Struktur folder penting

```
src/
  app/
    (auth)/login, (auth)/register     # halaman publik
    (customer)/menu, cart, checkout,  # halaman pelanggan (wajib login)
    orders
    admin/...                         # halaman admin (wajib role ADMIN)
  actions/        # Server Actions (auth, orders, admin)
  components/     # UI (shadcn) + komponen fitur
  hooks/          # useCart, useCartSync
  lib/            # supabase client/server/proxy, format, validasi, auth helper
  proxy.ts        # proxy Next.js: refresh sesi + proteksi rute
supabase/
  schema.sql      # skema database lengkap, siap dijalankan di Supabase SQL Editor
```

## Catatan

- Kolom `password` pada tabel `public.users` (sesuai rancangan class diagram) berisi salinan hash
  bcrypt dari Supabase Auth, bukan password asli, dan **tidak bisa dibaca lewat API**
  (lihat bagian `GRANT`/`REVOKE` di `schema.sql`).
- Harga & ketersediaan stok **selalu dihitung ulang di database** saat pesanan dibuat
  (function `create_order`), sehingga aman dari manipulasi harga di sisi klien.
- Script `schema.sql` aman dijalankan berulang kali (idempotent) dan tidak akan menghapus data yang sudah ada.
