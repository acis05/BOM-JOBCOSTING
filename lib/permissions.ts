export const PERMISSIONS=[
 ['dashboard.view','Lihat Dashboard'],['bom.view','Lihat BOM'],['bom.create','Buat BOM'],['bom.edit','Edit BOM'],['bom.delete','Hapus BOM'],['bom.import','Import BOM'],['bom.print','Cetak BOM'],
 ['wo.view','Lihat WO'],['wo.create','Buat WO'],['wo.edit','Edit / Submit WO'],['wo.delete','Hapus WO'],['wo.import','Import WO'],['wo.print','Cetak WO'],
 ['approval.view','Lihat Approval'],['approval.approve','Approve / Reject WO'],
 ['accurate.view','Lihat Accurate Sync'],['accurate.connect','Connect Accurate'],['accurate.sync','Sinkron Master'],['accurate.push_job','Kirim Pekerjaan Pesanan'],['accurate.rollover','Kirim Roll Over'],
 ['access.manage','Kelola User & Hak Akses']
] as const;
export type PermissionKey=typeof PERMISSIONS[number][0];
export const ALL_PERMISSION_KEYS=PERMISSIONS.map(x=>x[0]);
