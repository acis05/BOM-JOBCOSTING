import {query} from '@/lib/db';import {accurateFetch,getConnection,accurateDate} from '@/lib/accurate';
export async function POST(req:Request){
  const{workOrderId}=await req.json();const c=await getConnection();if(!c?.session_id)return Response.json({error:'Accurate Online belum terhubung atau database belum dipilih.'},{status:400});
  const w=await query<any>('SELECT * FROM work_orders WHERE id=$1',[workOrderId]);const wo=w.rows[0];
  if(!wo||!['APPROVED','SYNC_ERROR'].includes(wo.status))return Response.json({error:'WO harus sudah disetujui.'},{status:400});
  const mats=await query<any>('SELECT * FROM work_order_materials WHERE work_order_id=$1 ORDER BY id',[workOrderId]);
  const costs=await query<any>('SELECT * FROM work_order_costs WHERE work_order_id=$1 ORDER BY id',[workOrderId]);
  const form=new URLSearchParams(); const p='data[0]';
  form.set(`${p}.transDate`,accurateDate(wo.wo_date));form.set(`${p}.number`,wo.wo_no);form.set(`${p}.description`,`${wo.wo_no} - ${wo.product_name}`);
  mats.rows.forEach((m:any,i:number)=>{form.set(`${p}.detailItem[${i}].itemNo`,m.item_no);form.set(`${p}.detailItem[${i}].quantity`,String(m.qty));if(m.unit)form.set(`${p}.detailItem[${i}].itemUnitName`,m.unit);});
  costs.rows.forEach((k:any,i:number)=>{if(k.account_no)form.set(`${p}.detailExpense[${i}].accountNo`,k.account_no);form.set(`${p}.detailExpense[${i}].expenseAmount`,String(k.amount));form.set(`${p}.detailExpense[${i}].expenseName`,k.cost_name);});
  try{
    const res=await accurateFetch('/api/job-order/bulk-save.do',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:form});const text=await res.text();let j:any;try{j=JSON.parse(text)}catch{j={raw:text}};
    if(!res.ok||j.s===false)throw new Error(j.d?.join?.('; ')||j.error||text.slice(0,300));
    const rr=Array.isArray(j.r)?j.r[0]:j.r;const jobId=String(rr?.id||'');const jobNo=String(rr?.number||rr?.no||wo.wo_no);
    await query(`UPDATE work_orders SET status='SYNCED',accurate_job_id=$2,accurate_job_no=$3,sync_error=NULL,updated_at=NOW() WHERE id=$1`,[workOrderId,jobId,jobNo]);
    await query(`INSERT INTO sync_logs(entity_type,entity_id,action,status,message) VALUES('WORK_ORDER',$1,'PUSH_JOB','SUCCESS',$2)`,[String(workOrderId),jobNo]);
    return Response.json({ok:true,jobId,jobNo});
  }catch(e:any){await query(`UPDATE work_orders SET status='SYNC_ERROR',sync_error=$2 WHERE id=$1`,[workOrderId,e.message]);return Response.json({error:e.message},{status:400})}
}
