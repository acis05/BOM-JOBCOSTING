# v0.4.5 — Trial quota hard enforcement

- Trial Step 1/Pekerjaan Pesanan maksimal 2 kali per perusahaan.
- Trial Step 2/Roll Over maksimal 2 kali per perusahaan.
- Kuota disimpan langsung pada `organizations`, tidak hanya dihitung dari `sync_logs`.
- Kuota di-reserve dengan row lock (`SELECT ... FOR UPDATE`) sehingga klik cepat/browser lain/API manual tidak bisa melewati limit.
- Pengiriman ke-3 diblokir di backend dengan HTTP 402 dan tombol Aktivasi Paket.
- Migration backfill penggunaan lama dari `sync_logs`, sehingga trial yang sudah memakai 2 transaksi tidak mendapat kuota baru setelah upgrade.
- Akun dianggap trial bila `status=TRIAL` atau `plan_code=TRIAL`, menutup celah status data lama.
- Slot Step 1 dilepas kembali bila Accurate benar-benar menolak transaksi.
- Slot Step 2 dilepas pada gagal biasa, tetapi tetap terpakai untuk `PERLU VERIFIKASI` karena transaksi mungkin sudah terbentuk di Accurate.
