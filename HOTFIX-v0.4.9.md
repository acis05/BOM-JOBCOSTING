# v0.4.9 — Branch Access per User

- Tambah hak akses Cabang Accurate per user: ALL atau LIMITED.
- User LIMITED hanya melihat cabang yang dipilih di form WO.
- Jika hanya 1 cabang, cabang otomatis terpilih.
- Daftar/preview/edit/submit/approve/delete WO difilter dan divalidasi berdasarkan cabang user.
- Step 1 dan Step 2 Accurate juga divalidasi di backend berdasarkan cabang.
- Import WO user LIMITED wajib menyertakan kolom Cabang.
- User existing default ALL agar upgrade tidak menghilangkan akses.
