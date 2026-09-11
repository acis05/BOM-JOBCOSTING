# v0.2.9 - Roll Over, Delete, & Hak Akses

Perubahan:

- Setelah Pekerjaan Pesanan berhasil dibuat, aplikasi otomatis membuat Roll Over tipe `ITEM` untuk barang jadi WO.
- Jika Job Order berhasil tetapi Roll Over gagal, WO menjadi `ROLLOVER_ERROR` dan dapat di-retry tanpa membuat Job Order baru.
- Tombol Hapus BOM dan WO dibuat konsisten. Menghapus WO yang sudah tersinkron hanya menghapus data lokal, bukan transaksi Accurate.
- Login lokal aplikasi, Users, Roles, dan Permissions.
- Hak akses terpisah untuk BOM, WO, Approval, Accurate Sync, Push Job, Roll Over, serta menu Hak Akses.

## Login pertama

Pada deployment pertama setelah upgrade, bila belum ada user aplikasi, migration otomatis membuat Administrator.

- Username default: `admin`
- Password default: `admin123`

Disarankan set Railway variable sebelum deploy:

```
APP_ADMIN_USERNAME=admin
APP_ADMIN_PASSWORD=<password-kuat-anda>
```

Setelah login, password juga dapat di-reset dari menu **Hak Akses**.

## Accurate Scope

Tetap gunakan:

```
item_view warehouse_view glaccount_view branch_view job_order_save roll_over_save
```
