# v0.2.4 Accurate API path + disconnect fix

- Fix URL API data Accurate: host hasil Open DB kini dipanggil melalui `/accurate/api/...`.
- Error HTML `<!DOCTYPE html>` saat sync master diperbaiki.
- Tambah tombol **Ganti Database**: menghapus database/session aktif serta cache master, tetapi OAuth tetap terhubung.
- Tambah tombol **Putuskan Accurate**: menghapus koneksi OAuth lokal dan cache master. BOM/WO tidak dihapus.
- Pesan error sync dibuat lebih ramah dan tidak menampilkan potongan HTML.
