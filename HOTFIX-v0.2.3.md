# v0.2.3 TypeScript Build Fix

Perbaikan utama:

- Menambahkan tipe eksplisit untuk baris material BOM (`MaterialLine`).
- Menambahkan tipe eksplisit untuk baris biaya BOM (`CostLine`).
- Menambahkan tipe parameter callback `map` dan `filter` di `components/BomForm.tsx`.
- Mempertahankan startup deployment-safe dari v0.2.2.

Error Railway yang diperbaiki:

```text
TypeScript strict mode: implicit any in components/BomForm.tsx
```

Railway:

- Build Command: `npm run build` (atau automatic)
- Start Command: `npm start`
- Pre-deploy Command: kosong
