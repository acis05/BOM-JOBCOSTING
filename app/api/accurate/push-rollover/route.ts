import {requireApiPermission} from '@/lib/auth';
import {pushWorkOrderRollover} from '@/lib/rollover';
import {query} from '@/lib/db';
import {reserveTrialQuota,releaseTrialQuota} from '@/lib/trial-quota';

export async function POST(req:Request){
  const a=await requireApiPermission('accurate.rollover');if(!a.ok)return a.response;
  const org=Number(a.user.organization_id),{workOrderId}=await req.json();let reserved=false;
  try{
    const w=(await query<any>('SELECT status,accurate_job_no FROM work_orders WHERE id=$1 AND organization_id=$2',[Number(workOrderId),org])).rows[0];
    if(!w)return Response.json({error:'WO tidak ditemukan.'},{status:404});
    if(!w.accurate_job_no)return Response.json({error:'Step 1 belum dilakukan.'},{status:400});
    if(!['SYNCED','ROLLOVER_ERROR'].includes(String(w.status)))return Response.json({error:'WO belum siap untuk Roll Over atau sudah selesai.'},{status:400});

    const quota=await reserveTrialQuota(org,'ROLL_OVER');reserved=quota.reserved;
    const out=await pushWorkOrderRollover(Number(workOrderId));
    return Response.json({ok:true,...out,message:'Step 2 berhasil. Roll Over / Penyelesaian Pesanan sudah masuk ke Accurate.'});
  }catch(e:any){
    if(e?.code==='TRIAL_LIMIT')return Response.json({error:e.message,activationRequired:true,usage:e.usage},{status:402});
    const raw=e?.message||'Gagal mengirim Roll Over.';const verify=raw.startsWith('ROLLOVER_VERIFY|'),msg=verify?raw.slice('ROLLOVER_VERIFY|'.length):raw;
    // A VERIFY response may already have created the Roll Over in Accurate, so its trial slot remains consumed.
    if(reserved&&!verify)await releaseTrialQuota(org,'ROLL_OVER').catch(()=>{});
    await query(`UPDATE work_orders SET status=$3,rollover_error=$4,updated_at=NOW() WHERE id=$1 AND organization_id=$2`,[Number(workOrderId),org,verify?'ROLLOVER_VERIFY':'ROLLOVER_ERROR',msg]).catch(()=>{});
    await query(`INSERT INTO sync_logs(organization_id,entity_type,entity_id,action,status,message) VALUES($1,'WORK_ORDER',$2,'PUSH_ROLLOVER',$3,$4)`,[org,String(workOrderId),verify?'VERIFY':'ERROR',msg.slice(0,1500)]).catch(()=>{});
    return Response.json({error:msg,verificationRequired:verify},{status:400});
  }
}
