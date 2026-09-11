import {accurateFetch} from '@/lib/accurate';
import {pool} from '@/lib/db';

type Kind='items'|'warehouses'|'accounts';
function rowsFromResponse(j:any):any[]{
  if(Array.isArray(j)) return j;
  if(Array.isArray(j?.d)) return j.d;
  if(Array.isArray(j?.data)) return j.data;
  if(Array.isArray(j?.r)) return j.r;
  if(Array.isArray(j?.r?.d)) return j.r.d;
  return [];
}
async function fetchAll(path:string,fields:string){
  const out:any[]=[]; const pageSize=100; let page=1;
  while(page<=200){
    const u=new URLSearchParams({'sp.page':String(page),'sp.pageSize':String(pageSize),fields});
    const res=await accurateFetch(`${path}?${u.toString()}`);
    const text=await res.text();
    let j:any;
    try{j=JSON.parse(text)}catch{
      throw new Error(`Accurate mengembalikan halaman non-API. Periksa host/session database atau endpoint sinkronisasi. HTTP ${res.status}`);
    }
    if(!res.ok||j?.s===false) throw new Error(j?.d?.join?.('; ')||j?.error||`Gagal membaca Accurate (${res.status})`);
    const rows=rowsFromResponse(j); out.push(...rows);
    const pageCount=Number(j?.sp?.pageCount||0);
    if((pageCount&&page>=pageCount)||rows.length<pageSize) break;
    page++;
  }
  return out;
}
export async function syncAccurateMasters(kinds:Kind[]=['items','warehouses','accounts']){
  const c=await pool.connect(); const result:any={};
  try{
    if(kinds.includes('items')){
      const rows=await fetchAll('/api/item/list.do','id,no,name,unit1Name,itemType,suspended');
      await c.query('BEGIN');
      await c.query('DELETE FROM items_cache');
      for(const x of rows){ if(!x?.no) continue; await c.query(`INSERT INTO items_cache(accurate_id,item_no,name,unit,item_type,updated_at) VALUES($1,$2,$3,$4,$5,NOW()) ON CONFLICT(item_no) DO UPDATE SET accurate_id=EXCLUDED.accurate_id,name=EXCLUDED.name,unit=EXCLUDED.unit,item_type=EXCLUDED.item_type,updated_at=NOW()`,[x.id||null,x.no,x.name||x.no,x.unit1Name||x.unitName||null,x.itemType||null]); }
      await c.query('COMMIT'); result.items=rows.length;
    }
    if(kinds.includes('warehouses')){
      const rows=await fetchAll('/api/warehouse/list.do','id,name');
      await c.query('BEGIN');
      await c.query('DELETE FROM warehouses_cache');
      for(const x of rows){ if(!x?.name) continue; await c.query(`INSERT INTO warehouses_cache(accurate_id,name,updated_at) VALUES($1,$2,NOW()) ON CONFLICT(accurate_id) DO UPDATE SET name=EXCLUDED.name,updated_at=NOW()`,[x.id||null,x.name]); }
      await c.query('COMMIT'); result.warehouses=rows.length;
    }
    if(kinds.includes('accounts')){
      const rows=await fetchAll('/api/glaccount/list.do','id,no,name,accountType,suspended');
      await c.query('BEGIN');
      await c.query('DELETE FROM accounts_cache');
      for(const x of rows){ if(!x?.no) continue; await c.query(`INSERT INTO accounts_cache(accurate_id,account_no,name,account_type,updated_at) VALUES($1,$2,$3,$4,NOW()) ON CONFLICT(account_no) DO UPDATE SET accurate_id=EXCLUDED.accurate_id,name=EXCLUDED.name,account_type=EXCLUDED.account_type,updated_at=NOW()`,[x.id||null,x.no,x.name||x.no,x.accountType||null]); }
      await c.query('COMMIT'); result.accounts=rows.length;
    }
    return result;
  }catch(e){try{await c.query('ROLLBACK')}catch{};throw e}finally{c.release()}
}
