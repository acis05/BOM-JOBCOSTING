import {query} from '@/lib/db';
export async function GET(){
  const [i,w,a]=await Promise.all([
    query<any>('SELECT COUNT(*)::int c FROM items_cache'),
    query<any>('SELECT COUNT(*)::int c FROM warehouses_cache'),
    query<any>('SELECT COUNT(*)::int c FROM accounts_cache')
  ]);
  return Response.json({items:i.rows[0].c,warehouses:w.rows[0].c,accounts:a.rows[0].c});
}
