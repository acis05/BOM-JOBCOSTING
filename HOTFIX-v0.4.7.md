# BOM-JOBCOSTING AOL v0.4.7

Perubahan:
- BOM material: Keterangan Detail, Departemen, Project (opsional).
- BOM biaya: Keterangan Detail, Departemen, Project (opsional). Project biaya disimpan internal karena API detailExpense Accurate tidak memiliki projectNo.
- Metadata BOM dibawa ke Work Order.
- Step 1 mengirim material detailNotes/departmentName/projectNo dan biaya expenseNotes/departmentName.
- Fix edit biaya WO agar input manual tidak di-reset oleh effect recalculation. Planned Qty dihitung hanya saat nilai Planned Qty benar-benar berubah.
- Gudang wajib pada create/edit/import WO dan divalidasi lagi saat Step 1 sebelum request ke Accurate.
