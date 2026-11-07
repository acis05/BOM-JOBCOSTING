import {requireApiPermission} from '@/lib/auth';import {pool,query} from '@/lib/db';
function num(v:any){const n=Number(v);return Number.isFinite(n)?n:0}
export async function GET(){const a=await requireApiPermission('wo.view');if(!a.ok)return a.response;return Response.json((await query<any>('SELECT * FROM work_orders WHERE organization_id=$1 ORDER BY created_at DESC',[a.user.organization_id])).rows)}
export async function POST(req:Request){const a=await requireApiPermission('wo.create');if(!a.ok)return a.response;const b=await req.json(),c=await pool.connect();try{await c.query('BEGIN');const bom=(await c.query<any>('SELECT * FROM boms WHERE id=$1 AND organization_id=$2',[b.bomId,a.user.organization_id])).rows[0];if(!bom)throw new Error('BOM tidak ditemukan');const planned=num(b.plannedQty);if(planned<=0)throw new Error('Planned Qty harus lebih besar dari 0.');const x=(await c.query<any>(`INSERT INTO work_orders(organization_id,wo_no,bom_id,product_item_no,product_name,planned_qty,warehouse_name,branch_id,branch_name,wo_date,notes,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'DRAFT') RETURNING *`,[a.user.organization_id,b.woNo,b.bomId,bom.product_item_no,bom.product_name,planned,b.warehouseName||null,b.branchId?Number(b.branchId):null,b.branchName||null,b.woDate||new Date().toISOString().slice(0,10),b.notes||null])).rows[0];

// Form WO adalah sumber angka yang disimpan. Jangan hitung ulang kalau form sudah mengirim lines,
// supaya angka di layar = angka yang tersimpan dan tidak terjadi double multiplication.
let materials=Array.isArray(b.materials)?b.materials:[];
if(!materials.length){const scale=planned/Number(bom.output_qty||1);const base=(await c.query<any>('SELECT * FROM bom_materials WHERE bom_id=$1',[b.bomId])).rows;materials=base.map((m:any)=>({itemNo:m.item_no,itemName:m.item_name,qty:Number(m.qty)*scale,unit:m.unit}))}
for(const m of materials){const qty=num(m.qty);if(m.itemNo&&qty>0)await c.query(`INSERT INTO work_order_materials(work_order_id,item_no,item_name,qty,unit) VALUES($1,$2,$3,$4,$5)`,[x.id,m.itemNo,m.itemName||m.itemNo,qty,m.unit||null])}

let costs=Array.isArray(b.costs)?b.costs:[];
if(!costs.length){const scale=planned/Number(bom.output_qty||1);const base=(await c.query<any>('SELECT * FROM bom_costs WHERE bom_id=$1',[b.bomId])).rows;costs=base.map((k:any)=>({costName:k.cost_name,accountNo:k.account_no,amount:Number(k.amount)*scale}))}
for(const k of costs){let n=String(k.costName||'').trim();if(!n&&k.accountNo)n=(await c.query<any>('SELECT name FROM accounts_cache WHERE organization_id=$1 AND account_no=$2',[a.user.organization_id,k.accountNo])).rows[0]?.name||k.accountNo;if(n)await c.query(`INSERT INTO work_order_costs(work_order_id,cost_name,account_no,amount) VALUES($1,$2,$3,$4)`,[x.id,n,k.accountNo||null,num(k.amount)])}
await c.query('COMMIT');return Response.json(x)}catch(e:any){await c.query('ROLLBACK');return Response.json({error:e.message},{status:400})}finally{c.release()}}
