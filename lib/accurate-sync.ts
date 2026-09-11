import {accurateFetch} from '@/lib/accurate';import {pool} from '@/lib/db';import {getCurrentUser} from '@/lib/auth';
type Kind='items'|'warehouses'|'accounts'|'branches';
function rowsFromResponse(j:any):any[]{if(Array.isArray(j))return j;if(Array.isArray(j?.d))return j.d;if(Array.isArray(j?.data))return j.data;if(Array.isArray(j?.r))return j.r;if(Array.isArray(j?.r?.d))return j.r.d;return []}
async function fetchAll(path:string,fields:string){const out:any[]=[];const pageSize=100;let page=1;while(page<=200){const u=new URLSearchParams({'sp.page':String(page),'sp.pageSize':String(pageSize),fields});const res=await accurateFetch(`${path}?${u.toString()}`);const text=await res.text();let j:any;try{j=JSON.parse(text)}catch{throw new Error(`Accurate mengembalikan response non-API. HTTP ${res.status}`)}if(!res.ok||j?.s===false)throw new Error(j?.d?.join?.('; ')||j?.error||`Gagal membaca Accurate (${res.status})`);const rows=rowsFromResponse(j);out.push(...rows);const pageCount=Number(j?.sp?.pageCount||0);if((pageCount&&page>=pageCount)||rows.length<pageSize)break;page++}return out}
function objectFromResponse(j:any):any{if(j?.d&&typeof j.d==='object'&&!Array.isArray(j.d))return j.d;if(j?.r&&typeof j.r==='object'&&!Array.isArray(j.r))return j.r;if(j?.data&&typeof j.data==='object'&&!Array.isArray(j.data))return j.data;return j}
async function fetchItemDetail(id:any){if(!id)return null;const u=new URLSearchParams({id:String(id)});const res=await accurateFetch(`/api/item/detail.do?${u.toString()}`);const text=await res.text();let j:any;try{j=JSON.parse(text)}catch{return null}if(!res.ok||j?.s===false)return null;return objectFromResponse(j)}
async function enrichMissingItemUnits(items:any[]){const missing=items.filter(x=>!x?.unit1Name&&!x?.unitName&&x?.id);const concurrency=8;for(let start=0;start<missing.length;start+=concurrency){const batch=missing.slice(start,start+concurrency);const details=await Promise.all(batch.map(x=>fetchItemDetail(x.id).catch(()=>null)));details.forEach((d,i)=>{if(!d)return;const x=batch[i];const unit=d.unit1Name||d.unitName||d.itemUnitName||null;if(unit)x.unit1Name=unit;if(!x.name&&d.name)x.name=d.name;if(!x.no&&d.no)x.no=d.no})}return items}
export async function syncAccurateMasters(kinds:Kind[]=['items','warehouses','accounts','branches']){const me=await getCurrentUser();if(!me)throw new Error('Silakan login');const org=me.organization_id;const c=await pool.connect();const result:any={};try{if(kinds.includes('items')){
  const rows=await fetchAll('/api/item/list.do','id,no,name,unit1Name,itemType,suspended');
  // Accurate can theoretically return the same record more than once across pages while data changes.
  // Deduplicate before writing the cache so sync remains deterministic.
  const byNo=new Map<string,any>();
  for(const x of rows){if(x?.no)byNo.set(String(x.no),x)}
  const items=await enrichMissingItemUnits([...byNo.values()]);
  await c.query('BEGIN');
  // Also drop legacy global constraints here as a safety net for databases upgraded from pre multi-tenant releases.
  await c.query('ALTER TABLE items_cache DROP CONSTRAINT IF EXISTS items_cache_item_no_key');
  await c.query('ALTER TABLE items_cache DROP CONSTRAINT IF EXISTS items_cache_accurate_id_key');
  await c.query('DROP INDEX IF EXISTS items_cache_item_no_key');
  await c.query('DROP INDEX IF EXISTS items_cache_accurate_id_key');
  await c.query('DELETE FROM items_cache WHERE organization_id=$1',[org]);
  for(const x of items){
    await c.query(`INSERT INTO items_cache(organization_id,accurate_id,item_no,name,unit,item_type,updated_at) VALUES($1,$2,$3,$4,$5,$6,NOW()) ON CONFLICT(organization_id,item_no) DO UPDATE SET accurate_id=EXCLUDED.accurate_id,name=EXCLUDED.name,unit=EXCLUDED.unit,item_type=EXCLUDED.item_type,updated_at=NOW()`,[org,x.id||null,x.no,x.name||x.no,x.unit1Name||x.unitName||null,x.itemType||null])
  }
  await c.query('COMMIT');
  result.items=items.length
}
if(kinds.includes('warehouses')){const rows=await fetchAll('/api/warehouse/list.do','id,name');await c.query('BEGIN');await c.query('DELETE FROM warehouses_cache WHERE organization_id=$1',[org]);for(const x of rows){if(!x?.name)continue;await c.query(`INSERT INTO warehouses_cache(organization_id,accurate_id,name,updated_at) VALUES($1,$2,$3,NOW()) ON CONFLICT(organization_id,accurate_id) DO UPDATE SET name=EXCLUDED.name,updated_at=NOW()`,[org,x.id||null,x.name])}await c.query('COMMIT');result.warehouses=rows.length}
if(kinds.includes('accounts')){const rows=await fetchAll('/api/glaccount/list.do','id,no,name,accountType,suspended');await c.query('BEGIN');await c.query('DELETE FROM accounts_cache WHERE organization_id=$1',[org]);for(const x of rows){if(!x?.no)continue;await c.query(`INSERT INTO accounts_cache(organization_id,accurate_id,account_no,name,account_type,updated_at) VALUES($1,$2,$3,$4,$5,NOW()) ON CONFLICT(organization_id,account_no) DO UPDATE SET accurate_id=EXCLUDED.accurate_id,name=EXCLUDED.name,account_type=EXCLUDED.account_type,updated_at=NOW()`,[org,x.id||null,x.no,x.name||x.no,x.accountType||null])}await c.query('COMMIT');result.accounts=rows.length}
if(kinds.includes('branches')){const rows=await fetchAll('/api/branch/list.do','id,name');await c.query('BEGIN');await c.query('DELETE FROM branches_cache WHERE organization_id=$1',[org]);for(const x of rows){if(!x?.name)continue;await c.query(`INSERT INTO branches_cache(organization_id,accurate_id,name,updated_at) VALUES($1,$2,$3,NOW()) ON CONFLICT(organization_id,accurate_id) DO UPDATE SET name=EXCLUDED.name,updated_at=NOW()`,[org,x.id||null,x.name])}await c.query('COMMIT');result.branches=rows.length}return result}catch(e){try{await c.query('ROLLBACK')}catch{}throw e}finally{c.release()}}
