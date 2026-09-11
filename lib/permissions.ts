export const PERMISSIONS = [
  ['dashboard.view','Dashboard - Lihat'],
  ['bom.view','BOM - Lihat'],['bom.create','BOM - Buat'],['bom.edit','BOM - Edit'],['bom.delete','BOM - Hapus'],['bom.import','BOM - Import Excel'],['bom.print','BOM - Preview / Cetak'],
  ['wo.view','WO - Lihat'],['wo.create','WO - Buat'],['wo.edit','WO - Edit'],['wo.delete','WO - Hapus'],['wo.import','WO - Import Excel'],['wo.print','WO - Preview / Cetak'],
  ['approval.view','Approval - Lihat'],['approval.approve','Approval - Approve / Reject'],
  ['accurate.view','Accurate - Lihat'],['accurate.connect','Accurate - Hubungkan / Putuskan'],['accurate.sync','Accurate - Sinkron Master'],['accurate.push_job','Accurate - Kirim Pekerjaan Pesanan'],['accurate.rollover','Accurate - Kirim Roll Over / Produk Jadi'],
  ['access.manage','Hak Akses - Kelola User & Role'],
] as const;

export type PermissionKey = typeof PERMISSIONS[number][0];
export const ALL_PERMISSION_KEYS = PERMISSIONS.map(x=>x[0]);
export const PERMISSION_LABEL = Object.fromEntries(PERMISSIONS) as Record<string,string>;
