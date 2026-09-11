# v0.3.2 — Accurate Unit Auto-Fill

Perubahan:
- Satuan Barang Jadi otomatis dari master Item Accurate.
- Satuan Bahan Baku otomatis dari master Item Accurate dan read-only di form BOM.
- Server memvalidasi ulang nama dan satuan dari items_cache saat create/update/import BOM.
- Menyimpan snapshot `product_unit` pada BOM.
- Preview BOM menampilkan Output Qty beserta satuan barang jadi.
- Import BOM tidak lagi memakai nama/satuan manual dari Excel; master Accurate menjadi sumber data.
- Import BOM discope per organization untuk multi-tenant.
