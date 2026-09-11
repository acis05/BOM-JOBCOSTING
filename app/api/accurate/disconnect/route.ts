import {requireApiPermission} from '@/lib/auth';
import {query} from '@/lib/db';

export async function POST(){const auth=await requireApiPermission('accurate.connect');if(!auth.ok)return auth.response;
  await query('DELETE FROM accurate_connections');
  await Promise.all([
    query('DELETE FROM items_cache'),
    query('DELETE FROM warehouses_cache'),
    query('DELETE FROM accounts_cache'),
    query('DELETE FROM branches_cache')
  ]);
  return Response.json({ok:true,message:'Koneksi Accurate Online telah diputus dari aplikasi ini.'});
}
