# BOM-JOBCOSTING AOL v0.2

**Dari Formula ke Job Costing Accurate Online**

MVP Next.js + PostgreSQL untuk membuat BOM / Formula, membuat Work Order, approval, lalu mengirim WO yang disetujui ke Accurate Online Pekerjaan Pesanan.

## Update v0.2

- Import BOM dari Excel `.xlsx`
- Import WO dari Excel `.xlsx`
- List, edit, delete, preview & print BOM
- List, edit, delete, preview & print WO
- Halaman Accurate Sync disederhanakan (tanpa istilah teknis untuk user)
- Fix OAuth callback agar kembali ke domain publik, bukan `localhost:8080`
- Sinkron master Accurate: Item, Warehouse, GL Account
- Pilihan Barang & Akun Accurate muncul saat membuat/edit BOM
- Pilihan Gudang Accurate muncul saat membuat/edit WO
- Push WO approved langsung ke `/api/job-order/bulk-save.do`

## Railway Variables

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
ACCURATE_CLIENT_ID=...
ACCURATE_CLIENT_SECRET=...
ACCURATE_REDIRECT_URI=https://bomjobcosting.acisapps.id/api/accurate/oauth/callback
ACCURATE_SCOPE=item_view warehouse_view glaccount_view job_order_save roll_over_save
```

Opsional, tapi disarankan:

```text
APP_URL=https://bomjobcosting.acisapps.id
```

## Accurate Developer Area

Website URL:

```text
https://bomjobcosting.acisapps.id
```

OAuth Callback:

```text
https://bomjobcosting.acisapps.id/api/accurate/oauth/callback
```

## Railway

`railway.json` sudah mengatur:

- Pre-deploy: `npm run db:migrate`
- Start: `npm start`
- Health check: `/api/health`

Jadi jangan set `npm run db:migrate` sebagai Start Command.

## Alur Koneksi Accurate

1. Accurate Sync → Connect Accurate Online
2. Give Access
3. Kembali otomatis ke `/accurate`
4. Klik `Tampilkan Database`
5. Pilih database
6. Aplikasi otomatis mencoba sync Barang, Gudang, dan Akun
7. Jika diperlukan tekan `Sinkronkan Sekarang`

Setelah sync, halaman New BOM akan menampilkan pilihan item dan akun dari Accurate.

## Template Excel

Tersedia langsung dari halaman BOM/WO dan juga di:

```text
/public/templates/template-import-bom.xlsx
/public/templates/template-import-wo.xlsx
```

### BOM Excel

Kolom template:

```text
BOM No
Formula Name
Product Item No
Product Name
Output Qty
Material Item No
Material Name
Material Qty
Material Unit
Cost Name
Account No
Cost Amount
Notes
```

Satu BOM dapat memakai beberapa baris. Ulangi `BOM No`, formula dan product pada setiap baris material.

### WO Excel

Kolom:

```text
WO No
BOM No
Planned Qty
Warehouse
WO Date
Notes
```

WO yang diimpor akan mengambil material dan biaya dari BOM lalu dikalikan sesuai Planned Qty.

## Menjalankan lokal

```bash
npm install
npm run db:migrate
npm run dev
```

## Update GitHub existing repository

Extract ZIP ini, copy seluruh file ke repository lama (replace file yang sama), lalu:

```bash
git add .
git commit -m "BOM-JOBCOSTING v0.2"
git push
```

Railway akan redeploy dari GitHub.
