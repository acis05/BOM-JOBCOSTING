import {query} from '@/lib/db';

export async function POST(){
  const c=await query<any>('SELECT id FROM accurate_connections ORDER BY id DESC LIMIT 1');
  if(!c.rows[0]) return Response.json({error:'Koneksi Accurate tidak ditemukan'},{status:400});
  await query(`UPDATE accurate_connections SET database_id=NULL,database_alias=NULL,api_host=NULL,session_id=NULL,updated_at=NOW() WHERE id=$1`,[c.rows[0].id]);
  await Promise.all([
    query('DELETE FROM items_cache'),
    query('DELETE FROM warehouses_cache'),
    query('DELETE FROM accounts_cache')
  ]);
  return Response.json({ok:true,message:'Database Accurate dilepas. Silakan pilih database lain.'});
}
