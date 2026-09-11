# v0.3.3 — Accurate Unit Sync Fix

Perbaikan:
- Jika `unit1Name` tidak tersedia di `/api/item/list.do`, aplikasi otomatis membaca `/api/item/detail.do?id=...`.
- Detail item hanya dipanggil untuk item yang satuannya kosong, dengan concurrency terbatas.
- Satuan disimpan kembali ke `items_cache.unit` dan otomatis tampil read-only pada Barang Jadi dan Bahan Baku BOM.

Sesudah deploy, buka Accurate Online > Sinkronkan Sekarang satu kali agar cache satuan diperbarui.
