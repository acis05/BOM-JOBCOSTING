import {requireApiPermission} from '@/lib/auth';
import {query} from '@/lib/db';
export async function GET(){const auth=await requireApiPermission('accurate.view');if(!auth.ok)return auth.response;
  const [i,w,a,b]=await Promise.all([
    query<any>('SELECT COUNT(*)::int c FROM items_cache'),
    query<any>('SELECT COUNT(*)::int c FROM warehouses_cache'),
    query<any>('SELECT COUNT(*)::int c FROM accounts_cache'),
    query<any>('SELECT COUNT(*)::int c FROM branches_cache')
  ]);
  return Response.json({items:i.rows[0].c,warehouses:w.rows[0].c,accounts:a.rows[0].c,branches:b.rows[0].c});
}
