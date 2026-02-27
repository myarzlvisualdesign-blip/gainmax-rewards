

# GainMax — Cashback & Affiliate Platform

## Overview
Aplikasi cashback & affiliate dengan sistem membership berlangganan, referral bertingkat, affiliate marketplace, dan multi-role dashboard. Desain mengikuti STYLE MOVA: mobile-first (375px), dominan merah #E60023, clean, modern, fintech-style.

---

## 1. Landing Page (MOVA Style)
- **Hero Section**: Headline besar "LEVEL UP YOUR SHOPPING GAME", subheadline persuasif, dua CTA (Daftar Sekarang merah solid + Login outline), ilustrasi modern fintech
- **Trust Section**: Paragraf profesional menjelaskan GainMax sebagai penghubung affiliate marketplace (Shopee), bukan penjual produk
- **How to Get Cashback**: 4 step cards vertikal — Daftar & Login → Pilih Produk → Belanja Lewat Link → Reward Masuk Saldo. Icon minimalis, card rounded
- **FAQ Section**: Estimasi cashback, proses validasi, membership aktif
- **Design system**: Background putih/light gray, card putih soft shadow, rounded 16-20px, button rounded full, typography bold headline + light body, banyak whitespace

## 2. Database & Backend (Lovable Cloud / Supabase)
- **Tabel users**: id, name, email, role (enum: admin/staff/member), parent_id (hierarchical referral), referral_code, membership_level (silver/gold/diamond/none), membership_expired_at, status, balance fields
- **Tabel user_roles**: Untuk RLS — role disimpan terpisah sesuai best practice keamanan
- **Tabel products**: id, name, price, category, image_url, estimated_reward, affiliate_url
- **Tabel transactions_affiliate**: id, user_id, product_id, order_id, amount, reward, status (pending/valid/rejected/paid)
- **Tabel referral_commissions**: id, staff_id, member_id, amount, percentage, status
- **Tabel withdrawals**: id, user_id, amount, status (pending/approved/rejected)
- **RLS policies**: Menggunakan security definer function `has_role()` untuk menghindari recursive policies
- **Edge functions**: Kalkulasi komisi, validasi saldo, cek membership expiry

## 3. Authentication & Role System
- Satu halaman login untuk semua role
- Redirect otomatis berdasarkan role: Admin → /admin, Staff → /staff, Member → /dashboard
- Role divalidasi via backend (RLS + edge functions), tidak bisa dimanipulasi dari frontend
- Registrasi dengan referral_code opsional — otomatis set parent_id ke staff/member yang mengajak

## 4. Membership System (Stripe Subscription)
- 3 tier: Silver (5% komisi), Gold (10%), Diamond (15%)
- Pembayaran berlangganan bulanan via Stripe
- Badge warna berbeda di dashboard (Silver abu, Gold emas, Diamond merah gradient)
- Membership expired → komisi masuk saldo terkunci, tidak bisa withdraw
- Edge function cron job untuk cek expiry otomatis

## 5. Referral System
- Setiap staff/member punya referral_code unik
- Komisi berdasarkan level STAFF yang mengajak (bukan paket yang dibeli)
- Sisa komisi menjadi margin admin
- Data tersimpan di referral_commissions dengan tracking lengkap

## 6. Affiliate Marketplace
- Mini marketplace grid 2 kolom mobile-first
- Card produk: foto, nama, harga, estimasi cashback, tombol "Beli & Dapat Reward"
- Search bar rounded, filter kategori, sorting (reward tertinggi, harga terendah, terbaru)
- Produk diinput manual oleh admin via admin panel
- Affiliate link di-generate server-side (tidak expose API key di frontend)

## 7. Dashboard Anggota (MOVA Style)
- Card besar merah di atas: TOTAL SALDO bold + badge membership
- Menu icon grid: Affiliate, Referral, Riwayat, Withdraw
- Breakdown saldo: saldo_referral, saldo_affiliate, saldo_terkunci, saldo_bisa_ditarik
- Halaman Referral: referral code + jumlah downline
- Halaman Riwayat: list transaksi dengan status badge
- Halaman Withdraw: form penarikan dengan validasi membership aktif + saldo cukup

## 8. Dashboard Staff
- Daftar anggota di bawahnya (filter parent_id)
- Status membership anggota, total komisi dari downline
- Riwayat referral commission
- Tidak bisa akses data staff lain

## 9. Admin Panel
- Lihat semua staff + anggota hierarchy
- Input/validasi komisi affiliate
- Approve/reject withdrawal
- Manage akun (suspend/aktifkan, ubah membership)
- Monitoring: total reward, total withdraw, margin sistem
- CRUD produk affiliate

## 10. Keamanan
- Semua kalkulasi komisi & saldo di backend (edge functions)
- RLS policies pada semua tabel
- Role-based access menggunakan security definer functions
- Input sanitization & validation dengan Zod
- Rate limiting pada API calls
- Activity logging (login, withdraw, approval)

