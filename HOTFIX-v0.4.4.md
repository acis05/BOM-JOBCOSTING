# v0.4.4

- Fix formatter biaya yang sebelumnya dapat membaca `1000000.0000` menjadi 10.000x lebih besar karena semua tanda desimal dihapus.
- Biaya WO dihitung berdasarkan rasio Planned Qty / Output Qty BOM, sama seperti material.
- Nominal biaya bulat ditampilkan tanpa desimal.
- Step 1 Pekerjaan Pesanan hanya dapat dikirim sekali per WO, dikunci di UI dan API.
- Setelah Step 1 sukses, tombol Step 1 tetap terlihat tetapi disabled sebagai `Sudah Terkirim`.
- Step 2 Roll Over tampil setelah WO Approved tetapi disabled sampai Step 1 berhasil.
- Setelah Step 1 berhasil, Step 2 aktif.
