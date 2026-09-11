# v0.2.6 — Job Order error diagnostics

- Menampilkan pesan `sync_error` langsung di daftar Work Order.
- Validasi bahan baku terhadap master Item Accurate sebelum push Job Order.
- Validasi akun biaya terhadap master GL Account Accurate sebelum push.
- Biaya dengan amount 0 tidak dikirim.
- Pesan error API Accurate diparsing lebih lengkap dan disimpan ke sync log.
