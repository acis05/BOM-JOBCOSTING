# BOM-JOBCOSTING AOL

**Dari Formula ke Job Costing Accurate Online**

Aplikasi web sederhana untuk:

- Membuat Formula Produk / BOM
- Membuat Work Order berdasarkan BOM
- Mengalikan kebutuhan material dan biaya sesuai Qty WO
- Submit + approval WO
- OAuth Accurate Online
- Pilih database Accurate Online
- Push WO approved ke adapter Pekerjaan Pesanan / Job Costing Accurate
- PostgreSQL + Railway + GitHub ready

> Pembagian tanggung jawab: BOM-JOBCOSTING menyimpan planning, formula, WO dan approval. Actual inventory cost, jurnal dan job cost final tetap di Accurate Online.

## Stack

- Next.js 16
- React 19
- PostgreSQL
- Node `pg`
- Railway
- Accurate Online OAuth 2.0 Authorization Code

## Struktur Flow

```text
Accurate Master Data
       ↓
BOM / Formula
       ↓
Work Order
       ↓
DRAFT → SUBMITTED → APPROVED
       ↓
Push to Accurate
       ↓
Pekerjaan Pesanan / Job Costing
       ↓
Roll Over / Penyelesaian dilakukan di tahap berikutnya
```

## Menjalankan lokal

1. Siapkan PostgreSQL.
2. Copy `.env.example` menjadi `.env.local`.
3. Isi `DATABASE_URL`, `ACCURATE_CLIENT_ID`, `ACCURATE_CLIENT_SECRET`, dan callback URI.
4. Jalankan:

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Buka `http://localhost:3000`.

## Data demo

Seed membuat BOM contoh `BOM-0001 - Meja Office A` dengan material dan biaya contoh.

## Accurate OAuth

Callback default lokal:

```text
http://localhost:3000/api/accurate/oauth/callback
```

Untuk Railway, setelah domain dibuat, ubah menjadi misalnya:

```text
https://bom-jobcosting-production.up.railway.app/api/accurate/oauth/callback
```

Callback tersebut harus sama persis dengan URL OAuth Callback pada aplikasi di Developer Area Accurate.

Environment variables:

```text
DATABASE_URL=
APP_URL=
ACCURATE_CLIENT_ID=
ACCURATE_CLIENT_SECRET=
ACCURATE_REDIRECT_URI=
ACCURATE_SCOPE=item_view warehouse_view glaccount_view job_order_save roll_over_save
ACCURATE_JOB_SAVE_PATH=
```

**Penting:** `ACCURATE_SCOPE` di contoh hanyalah starting point. Gunakan scope persis yang muncul di Developer API Accurate untuk Item/Warehouse/Account/Pekerjaan Pesanan.

## Adapter Pekerjaan Pesanan

Public documentation Accurate menjelaskan mekanisme OAuth, DB List, Open DB, host dan `X-Session-ID`, tetapi endpoint dan parameter per modul perlu mengikuti Developer API Docs akun Anda.

Karena itu source sengaja memisahkan adapter di:

```text
app/api/accurate/push-job/route.ts
```

Isi variable:

```text
ACCURATE_JOB_SAVE_PATH=/accurate/api/<endpoint-pekerjaan-pesanan>/save.do
```

Source sudah menyiapkan payload generik:

```text
transDate
warehouseName
detailItem[n].itemNo
detailItem[n].quantity
detailExpense[n].accountNo
detailExpense[n].amount
```

Nama parameter final perlu dicocokkan dengan Developer API Accurate Anda sebelum transaksi production dikirim.

## Upload ke GitHub

Buat repo kosong, misalnya `bom-jobcosting-aol`, kemudian:

```bash
git init
git add .
git commit -m "Initial BOM-JOBCOSTING AOL"
git branch -M main
git remote add origin https://github.com/USERNAME/bom-jobcosting-aol.git
git push -u origin main
```

## Deploy ke Railway

1. Railway → **New Project** → **Deploy from GitHub Repo**.
2. Pilih repo `bom-jobcosting-aol`.
3. Tambahkan **PostgreSQL**.
4. Di service web, tambahkan reference variable `DATABASE_URL` dari PostgreSQL.
5. Tambahkan environment Accurate:

```text
ACCURATE_CLIENT_ID
ACCURATE_CLIENT_SECRET
ACCURATE_REDIRECT_URI
ACCURATE_SCOPE
```

6. Set **Pre-deploy Command**:

```bash
npm run db:migrate
```

7. Untuk demo pertama, jalankan seed satu kali dari Railway shell / command:

```bash
npm run db:seed
```

8. Generate public domain di Networking.
9. Update `ACCURATE_REDIRECT_URI` ke domain Railway dan daftarkan callback yang sama di Accurate Developer Area.
10. Redeploy.

## Health Check

```text
/api/health
```

Healthy response:

```json
{"status":"ok"}
```

## Catatan keamanan

- Jangan commit `.env` atau Client Secret ke GitHub.
- Client Secret hanya berada di environment server/Railway.
- Source demo belum memiliki sistem login multi-user. Tambahkan authentication sebelum digunakan oleh banyak user/public internet.
- Sebelum production, konfirmasi scope, endpoint, dan field Pekerjaan Pesanan dari Developer API Accurate.

## Tahap berikutnya

Setelah endpoint Pekerjaan Pesanan Anda dikonfirmasi, implementasi selanjutnya adalah:

1. Sync master Item / Warehouse / Account dari Accurate.
2. Mengganti input Item No manual dengan dropdown/search dari Accurate cache.
3. Final mapping WO → Pekerjaan Pesanan.
4. Tambahkan Roll Over / Penyelesaian Pesanan.
5. Tambahkan authentication dan role Maker / Approver.
