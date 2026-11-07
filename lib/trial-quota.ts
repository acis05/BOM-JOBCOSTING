import {pool,query} from '@/lib/db';

export type TrialAction='JOB_ORDER'|'ROLL_OVER';
const TRIAL_LIMIT=2;

function isTrialOrg(org:any){
  return String(org?.status||'').toUpperCase()==='TRIAL' || String(org?.plan_code||'').toUpperCase()==='TRIAL';
}

export async function getTrialUsage(organizationId:number){
  const r=await query<any>(`SELECT id,status,trial_ends_at,plan_code,COALESCE(trial_job_order_used,0)::int trial_job_order_used,COALESCE(trial_rollover_used,0)::int trial_rollover_used FROM organizations WHERE id=$1 LIMIT 1`,[organizationId]);
  const org=r.rows[0]||null;
  return {
    organization:org,
    isTrial:isTrialOrg(org),
    jobOrderCount:Number(org?.trial_job_order_used||0),
    rollOverCount:Number(org?.trial_rollover_used||0),
    limit:TRIAL_LIMIT,
  };
}

export async function reserveTrialQuota(organizationId:number,action:TrialAction){
  const c=await pool.connect();
  try{
    await c.query('BEGIN');
    const r=await c.query<any>(`SELECT id,status,plan_code,COALESCE(trial_job_order_used,0)::int trial_job_order_used,COALESCE(trial_rollover_used,0)::int trial_rollover_used FROM organizations WHERE id=$1 FOR UPDATE`,[organizationId]);
    const org=r.rows[0];
    if(!org)throw new Error('Akun perusahaan tidak ditemukan.');
    if(!isTrialOrg(org)){
      await c.query('COMMIT');
      return {reserved:false,isTrial:false,jobOrderCount:Number(org.trial_job_order_used||0),rollOverCount:Number(org.trial_rollover_used||0),limit:TRIAL_LIMIT};
    }
    const used=action==='JOB_ORDER'?Number(org.trial_job_order_used||0):Number(org.trial_rollover_used||0);
    if(used>=TRIAL_LIMIT){
      await c.query('ROLLBACK');
      const label=action==='JOB_ORDER'?'Pekerjaan Pesanan':'Roll Over';
      const e:any=new Error(`Batas trial sudah tercapai. Akun trial hanya dapat mengirim ${label} maksimal ${TRIAL_LIMIT} kali. Silakan aktivasi paket untuk melanjutkan.`);
      e.code='TRIAL_LIMIT';
      e.usage={jobOrderCount:Number(org.trial_job_order_used||0),rollOverCount:Number(org.trial_rollover_used||0),limit:TRIAL_LIMIT};
      throw e;
    }
    const col=action==='JOB_ORDER'?'trial_job_order_used':'trial_rollover_used';
    const u=await c.query<any>(`UPDATE organizations SET ${col}=COALESCE(${col},0)+1,updated_at=NOW() WHERE id=$1 RETURNING trial_job_order_used,trial_rollover_used`,[organizationId]);
    await c.query('COMMIT');
    return {reserved:true,isTrial:true,jobOrderCount:Number(u.rows[0]?.trial_job_order_used||0),rollOverCount:Number(u.rows[0]?.trial_rollover_used||0),limit:TRIAL_LIMIT};
  }catch(e){
    try{await c.query('ROLLBACK')}catch{}
    throw e;
  }finally{c.release()}
}

export async function releaseTrialQuota(organizationId:number,action:TrialAction){
  const col=action==='JOB_ORDER'?'trial_job_order_used':'trial_rollover_used';
  await query(`UPDATE organizations SET ${col}=GREATEST(COALESCE(${col},0)-1,0),updated_at=NOW() WHERE id=$1 AND (status='TRIAL' OR plan_code='TRIAL')`,[organizationId]);
}
