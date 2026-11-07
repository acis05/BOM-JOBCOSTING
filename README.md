# BOM-JOBCOSTING AOL v0.4.1

Aplikasi web pendukung Accurate Online untuk BOM / Formula → Work Order → Pekerjaan Pesanan → Roll Over.

## Perubahan utama v0.4.1

### Accurate dipisah menjadi 2 tahap

1. **Step 1 · Kirim Pekerjaan Pesanan**
   - Pengiriman pertama membuat Pekerjaan Pesanan di Accurate.
   - WO berubah menjadi `SYNCED / JOB SENT`.
   - WO dapat diedit lagi selama belum Roll Over.
   - Tombol **Kirim Tahap Berikutnya** mengirim perubahan ke Pekerjaan Pesanan yang sama menggunakan `accurate_job_id`.
   - Setiap pengiriman Step 1 yang sukses dicatat di `sync_logs`.

2. **Step 2 · Kirim Roll Over**
   - Dilakukan saat pekerjaan siap difinishing.
   - Tidak otomatis berjalan setelah Step 1.
   - Bila Accurate memberi response konflik tetapi transaksi kemungkinan sudah terbentuk, status menjadi `ROLLOVER_VERIFY` dan user dapat memakai **Tandai Sudah Masuk** setelah mengecek Accurate.

## Limit Trial

Trial 3 hari, maksimal:

- 5 user
- 5 database Accurate
- **2 kali pengiriman Step 1 Pekerjaan Pesanan**
- **2 WO Roll Over / Penyelesaian Pesanan**

Pengiriman ketiga akan mendapat HTTP 402 dan tombol **Aktivasi Paket**.

Untuk paket `ACTIVE`, limit transaksi trial tidak berlaku.

## Paket

- 6 Bulan: **Rp 3.000.000**
- 1 Tahun: **Rp 5.000.000**
- Maks. 5 user
- Maks. 5 database Accurate

## Railway Variables

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
APP_URL=https://bomjobcosting.acisapps.id
ACCURATE_CLIENT_ID=...
ACCURATE_CLIENT_SECRET=...
ACCURATE_REDIRECT_URI=https://bomjobcosting.acisapps.id/api/accurate/oauth/callback
ACCURATE_SCOPE=item_view warehouse_view glaccount_view branch_view job_order_save roll_over_save
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_PASSWORD=GANTI_PASSWORD_KUAT
```

Opsional untuk instalasi pertama:

```text
APP_ADMIN_USERNAME=admin
APP_ADMIN_PASSWORD=admin123
```

## Deploy

```bash
npm install
npm run build
npm start
```

Railway memakai `npm start`; `scripts/start.mjs` menjalankan migration lebih dahulu lalu menjalankan Next.js.

## URL

- Customer login: `/login`
- Daftar trial: `/register`
- Paket/aktivasi: `/subscription`
- Super Admin: `/admin/login`
- Health check: `/api/health`
