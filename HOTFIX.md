# BOM-JOBCOSTING AOL v0.2.2 deployment-safe hotfix

Perubahan deployment:
- Tidak memakai Railway pre-deploy migration agar migration yang lambat/gagal tidak mencegah web server hidup.
- `npm start` menjalankan migration maksimal 20 detik, lalu tetap menyalakan Next.js.
- Health check `/api/health` tidak query PostgreSQL.
- Dashboard menampilkan pesan ramah bila database belum siap, bukan crash 500.
- Next.js dipanggil langsung lewat Node dan bind `0.0.0.0:$PORT`.
- package-lock.json disertakan.
- Node engine dibatasi >=20 <25.

Railway Settings:
- Build Command: biarkan auto / `npm run build`
- Start Command: biarkan config dari railway.json / `npm start`
- Pre-deploy Command: KOSONGKAN di Railway UI

Variables minimum:
DATABASE_URL=${{Postgres.DATABASE_URL}}
APP_URL=https://bomjobcosting.acisapps.id
ACCURATE_REDIRECT_URI=https://bomjobcosting.acisapps.id/api/accurate/oauth/callback
ACCURATE_SCOPE=item_view warehouse_view glaccount_view job_order_save roll_over_save
