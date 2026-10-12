# v0.3.9 — WoActions JSX build fix

- Memperbaiki syntax JSX di `components/WoActions.tsx` yang membuat Turbopack gagal build dengan `Expected '</', got '{'`.
- Merapikan conditional action WO untuk SYNCED / ROLLOVER_ERROR / ROLLOVER_VERIFY.
- `Retry Hasil Jadi` hanya tampil untuk `ROLLOVER_ERROR` dan user yang punya akses rollover.
- `Tandai Sudah Masuk` tampil untuk `ROLLOVER_ERROR` dan `ROLLOVER_VERIFY`.
- Versi package menjadi 0.3.9.
