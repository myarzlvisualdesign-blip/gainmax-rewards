
# Overhaul GainMax: Full Manual Payment System

## Ringkasan
Mengubah seluruh sistem dari Tripay payment gateway menjadi **full manual payment** dengan upload bukti transfer, serta menambahkan fitur-fitur baru seperti upload produk oleh member/staff, QRIS management, dan admin panel yang lebih lengkap.

---

## FASE 1: Database Migration

### 1A. Ubah enum & tabel `payments`
- Ubah `payment_status` enum: `PENDING` | `BERHASIL` | `DITOLAK` (hapus UNPAID/EXPIRED/FAILED/REFUND)
- Hapus `payment_type` enum value `topup` (hanya `membership`)
- Tambah kolom baru di `payments`:
  - `proof_image_url` (text, nullable) -- URL bukti transfer
  - `payment_channel` (text) -- "BANK_SUPERBANK", "BANK_NEOBANK", "GOPAY", "SHOPEEPAY", "DANA", "OVO", "QRIS"
  - `admin_notes` (text, nullable)
  - `approved_at` (timestamptz, nullable)
  - `approved_by` (uuid, nullable)
- Hapus kolom Tripay: `tripay_reference`, `pay_code`, `checkout_url`, `payment_url`, `expired_time`, `fee`, `total_amount`, `merchant_ref`
- Buat `merchant_ref` nullable atau hapus (tidak lagi dibutuhkan karena manual)

### 1B. Tabel `membership_packages` (baru)
Untuk superadmin bisa mengatur harga dan komisi per paket:
```text
id, level (membership_level enum), price (numeric), referral_commission (numeric), 
commission_percentage (numeric), features (jsonb), is_active (boolean), 
created_at, updated_at
```
Insert default:
- Silver: 25000, komisi 10000, 40%
- Gold: 35000, komisi 15000, 42.86%
- Diamond: 50000, komisi 20000, 40%

### 1C. Tabel `site_settings` (baru)
Untuk QRIS image dan konfigurasi lainnya:
```text
id, key (text unique), value (text), updated_at
```
Default rows: `qris_image_url`, `bank_accounts` (JSON string berisi daftar rekening)

### 1D. Tabel `user_products` (baru)
Untuk upload produk oleh staff/member yang sudah berlangganan:
```text
id, user_id, category, title, description, image_url, 
shopee_link, buy_link, created_at, updated_at
```

### 1E. Tabel `notifications` (baru)
Untuk notifikasi real-time ke superadmin:
```text
id, user_id (target), type (text), title, message, 
is_read (boolean default false), reference_id (uuid nullable), 
created_at
```

### 1F. Update tabel `withdrawals`
- Tambah kolom: `bank_name` (text), `account_number` (text), `account_holder` (text)
- Ubah enum `withdrawal_status`: `pending` | `berhasil` | `ditolak`

### 1G. Update tabel `referral_commissions`
- Tambah kolom: `payment_id` (uuid, FK ke payments) -- track komisi dari pembayaran mana
- Ubah `status` menjadi enum: `pending` | `cair` | `dibatalkan`

### 1H. Update `profiles`
- Tambah: `shopee_affiliate_url` (text, nullable)

### 1I. Storage bucket
- Buat bucket `proof-images` (public) untuk upload bukti transfer
- Buat bucket `product-images` untuk foto produk
- Buat bucket `site-assets` untuk QRIS image

### 1J. RLS Policies
- `membership_packages`: SELECT public, ALL admin only
- `site_settings`: SELECT public, ALL admin only
- `user_products`: SELECT public, INSERT/UPDATE/DELETE owner only + admin
- `notifications`: SELECT own only, INSERT admin/system
- Storage buckets: proper upload/read policies

### 1K. Realtime
- Enable realtime untuk `payments`, `notifications`

---

## FASE 2: Backend (Edge Functions)

### 2A. Hapus edge functions Tripay
- Hapus `supabase/functions/tripay-create-transaction/`
- Hapus `supabase/functions/tripay-callback/`
- Update `supabase/config.toml` -- hapus config Tripay

### 2B. Edge function `approve-payment` (baru)
- Hanya bisa dipanggil oleh admin (cek role via service_role)
- Input: `payment_id`, `action` (approve/reject), `notes`
- Jika approve:
  1. Update payment status ke BERHASIL
  2. Update profiles: membership_level, membership_expired_at (+30 hari)
  3. Cek parent_id -- jika ada referrer, hitung komisi fixed dari `membership_packages`
  4. Insert ke `referral_commissions` dengan status "cair"
  5. Update saldo_referral dan saldo_bisa_ditarik referrer
  6. Insert notification ke superadmin
  7. Cek apakah referrer perlu naik jadi staff (jika masih member)
- Jika reject: update status ke DITOLAK

### 2C. Edge function `approve-withdrawal` (baru)
- Hanya admin
- Update status withdrawal ke berhasil/ditolak
- Jika berhasil: kurangi saldo_bisa_ditarik user

---

## FASE 3: Frontend - Halaman Member

### 3A. MembershipPage.tsx (overhaul total)
- Step 1: Pilih paket (Silver/Gold/Diamond) dengan harga dari `membership_packages`
- Step 2: Tampilkan info rekening bank + e-wallet + QRIS (dari `site_settings`)
  - Bank: SUPERBANK 000087164489, NEOBANK 5859459404602897
  - E-Wallet: GOPAY/SHOPEEPAY/DANA 083116513445, OVO 087768421811
  - QRIS: tampilkan gambar dari admin
- Step 3: Upload bukti transfer (ke storage bucket)
- Step 4: Submit -- buat record di `payments` dengan status PENDING
- Tampilkan pesan "Menunggu verifikasi admin"

### 3B. WithdrawPage.tsx (update)
- Tambah form: Bank/E-Wallet, No Rekening/Nomor, Nama Pemegang
- Validasi membership aktif
- Submit ke tabel withdrawals dengan info rekening

### 3C. Hapus TopupPage.tsx
- Tidak ada fitur top-up manual (saldo hanya dari komisi)

### 3D. Upload Produk (halaman baru: UserProductsPage.tsx)
- Form: Kategori, Foto, Judul, Deskripsi, Link Shopee, Link Beli
- Hanya bisa diakses jika membership aktif
- List produk yang sudah diupload user

### 3E. Profile Affiliate (di ReferralPage atau halaman baru)
- Input link affiliate Shopee
- Simpan ke profiles.shopee_affiliate_url

### 3F. HistoryPage.tsx (update)
- Tampilkan riwayat pembayaran membership (dari `payments`)
- Tampilkan riwayat komisi (dari `referral_commissions`)
- Tab: Pembayaran | Komisi | Withdraw

### 3G. DashboardHome.tsx (update)
- Tambah menu Upload Produk
- Hapus menu Topup

### 3H. MemberLayout.tsx (update)
- Update bottom nav: Home, Produk, Referral, Riwayat, Withdraw
- Hapus "Bayar" dari nav (membership diakses dari dashboard home)

---

## FASE 4: Frontend - Admin Panel (overhaul)

### 4A. AdminDashboard.tsx (overhaul total)
Tabs/sections:
1. **Dashboard**: Statistik (total member, staff, pendapatan, withdraw pending)
2. **Pembayaran**: List semua payments dengan bukti transfer, tombol ACC/Reject
3. **Withdraw**: List semua withdrawals dengan tombol ACC/Reject
4. **Users**: Daftar semua user dengan filter role, status membership
5. **Produk Admin**: CRUD produk affiliate (existing)
6. **Pengaturan**: Upload QRIS, atur harga paket, kelola rekening

### 4B. Notifikasi real-time
- Bell icon di header admin
- Count badge unread
- Dropdown list notifikasi
- Subscribe ke realtime `notifications` table

---

## FASE 5: Login & Role System

### 5A. Login.tsx (update)
- Tambah role selector (Superadmin/Staff/Member) sebagai pilihan visual
- Tetap satu form login, tapi redirect berdasarkan role dari database
- Role selector hanya untuk UX, validasi tetap dari backend

### 5B. ProtectedRoute (tetap sama)
- Admin role = "admin" (superadmin dalam UI)

### 5C. Staff Dashboard (update)
- Staff bisa lihat downline, komisi, dan upload produk
- Staff punya akses sama seperti member + lihat downline

---

## FASE 6: Keamanan & Anti-Manipulasi

- Komisi dihitung di edge function (server-side), bukan frontend
- Self-referral check: parent_id tidak boleh sama dengan user_id sendiri
- Komisi hanya 1x per user (unique constraint payment_id + referrer di referral_commissions)
- Saldo hanya bisa berubah via edge function (RLS mencegah update langsung dari client)
- Profiles saldo columns: hapus UPDATE policy dari user (user tidak bisa ubah saldo sendiri)

---

## FASE 7: Deployment

### 7A. vercel.json
- Buat file `vercel.json` dengan SPA rewrite rules

---

## Detail Teknis: Alur Pembayaran

```text
User pilih paket --> User lihat rekening/QRIS --> User transfer --> 
User upload bukti --> Submit (status=PENDING) --> 
Admin lihat di panel --> Admin klik ACC --> 
Edge function: update status=BERHASIL, aktifkan membership, 
hitung komisi referrer, update saldo --> Selesai
```

## Detail Teknis: Alur Komisi

```text
User B daftar dengan referral code User A -->
User B beli paket Silver (Rp 25.000) --> 
User B upload bukti --> Admin ACC -->
Sistem: komisi Rp 10.000 masuk ke saldo User A -->
Insert referral_commissions record -->
Jika User A masih member, promote ke staff
```

## File yang akan dibuat/diubah:

**Buat baru:**
- `vercel.json`
- `src/pages/dashboard/UserProductsPage.tsx`
- `supabase/functions/approve-payment/index.ts`
- `supabase/functions/approve-withdrawal/index.ts`

**Ubah:**
- `src/pages/Login.tsx` -- tambah role selector
- `src/pages/dashboard/MembershipPage.tsx` -- full manual payment
- `src/pages/dashboard/WithdrawPage.tsx` -- tambah info rekening
- `src/pages/dashboard/HistoryPage.tsx` -- tabs pembayaran/komisi/withdraw
- `src/pages/dashboard/DashboardHome.tsx` -- update menu
- `src/pages/dashboard/ReferralPage.tsx` -- tambah affiliate link
- `src/pages/AdminDashboard.tsx` -- overhaul total
- `src/pages/StaffDashboard.tsx` -- update dengan upload produk
- `src/components/layouts/MemberLayout.tsx` -- update nav
- `src/App.tsx` -- update routes
- `supabase/config.toml` -- hapus config Tripay

**Hapus:**
- `src/pages/dashboard/TopupPage.tsx`
- `supabase/functions/tripay-create-transaction/index.ts`
- `supabase/functions/tripay-callback/index.ts`

**Migrasi DB:** 1 migration besar yang mencakup semua perubahan schema
