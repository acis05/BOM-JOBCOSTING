# BOM-JOBCOSTING AOL v0.3.0

Tambahan SaaS / aktivasi manual:

- Trial gratis 3 hari melalui `/register`
- Paket 6 bulan Rp 1.500.000
- Paket 1 tahun Rp 2.500.000
- Maksimal 5 user aktif per perusahaan
- Maksimal 5 database Accurate per perusahaan
- Request aktivasi manual tanpa payment gateway
- Super Admin di `/admin/login`
- Dashboard Super Admin: trial, active, suspended, jumlah user, jumlah database, request aktivasi
- Aktivasi manual 6 bulan / 1 tahun dan suspend akun
- Data utama diberi `organization_id` untuk isolasi tenant

## Railway variables

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
APP_URL=https://bomjobcosting.acisapps.id
ACCURATE_CLIENT_ID=...
ACCURATE_CLIENT_SECRET=...
ACCURATE_REDIRECT_URI=https://bomjobcosting.acisapps.id/api/accurate/oauth/callback
ACCURATE_SCOPE=item_view warehouse_view glaccount_view branch_view job_order_save roll_over_save
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_PASSWORD=GANTI_PASSWORD_KUAT
```

`SUPER_ADMIN_USERNAME` dan `SUPER_ADMIN_PASSWORD` dipakai saat super admin pertama dibuat oleh migration. Untuk database yang sudah pernah dimigrasikan, akun superadmin pertama dibuat saat v0.3.0 pertama kali start.

## URL penting

- Customer Login: `/login`
- Daftar Trial: `/register`
- Paket / Aktivasi: `/subscription`
- Super Admin: `/admin/login`

## Harga

- Trial: 3 hari
- 6 bulan: Rp 1.500.000
- 1 tahun: Rp 2.500.000
- Maks. 5 user
- Maks. 5 database Accurate
