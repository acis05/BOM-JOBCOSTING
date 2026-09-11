# v0.2.7 — Branch + Approval Flow

- Sinkron master Cabang Accurate (`/api/branch/list.do`).
- Tambah pilihan Cabang Accurate pada Work Order.
- Job Order mengirim `branchId`/`branchName` agar database multi-cabang dapat menerima transaksi.
- WO baru memiliki dua aksi: **Simpan Draft** dan **Simpan & Ajukan Approval**.
- WO yang diajukan langsung masuk menu Approval.
- Tombol Submit diganti menjadi **Ajukan Approval**.
- WO `SYNC_ERROR` dapat diedit, lalu kembali menjadi Draft untuk diajukan ulang.
- Scope OAuth perlu `branch_view`. Setelah update scope, putuskan lalu hubungkan ulang Accurate agar access token baru mendapat scope tersebut.
