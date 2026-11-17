import {query} from '@/lib/db';

export type BranchAccess={mode:'ALL'|'LIMITED';branchIds:number[]};

export async function getUserBranchAccess(userId:number):Promise<BranchAccess>{
  const u=(await query<any>(`SELECT COALESCE(branch_access_mode,'ALL') mode FROM app_users WHERE id=$1`,[userId])).rows[0];
  const mode=String(u?.mode||'ALL').toUpperCase()==='LIMITED'?'LIMITED':'ALL';
  if(mode==='ALL')return {mode:'ALL',branchIds:[]};
  const r=await query<any>(`SELECT branch_accurate_id FROM app_user_branch_access WHERE user_id=$1 ORDER BY branch_accurate_id`,[userId]);
  return {mode:'LIMITED',branchIds:r.rows.map((x:any)=>Number(x.branch_accurate_id)).filter(Number.isFinite)};
}

export async function getAllowedBranches(userId:number,organizationId:number){
  const access=await getUserBranchAccess(userId);
  if(access.mode==='ALL')return (await query<any>(`SELECT accurate_id,name FROM branches_cache WHERE organization_id=$1 ORDER BY name`,[organizationId])).rows;
  if(!access.branchIds.length)return [];
  return (await query<any>(`SELECT accurate_id,name FROM branches_cache WHERE organization_id=$1 AND accurate_id=ANY($2::bigint[]) ORDER BY name`,[organizationId,access.branchIds])).rows;
}

export async function assertBranchAccess(userId:number,organizationId:number,branchId:any,branchName?:any){
  const access=await getUserBranchAccess(userId);
  if(access.mode==='ALL')return true;
  const id=Number(branchId);
  if(!Number.isFinite(id)||!access.branchIds.includes(id))throw new Error('Cabang tidak termasuk hak akses user ini.');
  const ok=(await query<any>(`SELECT 1 FROM branches_cache WHERE organization_id=$1 AND accurate_id=$2${branchName?' AND name=$3':''}`,[organizationId,id,...(branchName?[String(branchName)]:[])])).rows[0];
  if(!ok)throw new Error('Cabang tidak valid atau belum disinkronkan dari Accurate.');
  return true;
}

export function branchFilterSql(access:BranchAccess,alias='w',startParam=2){
  if(access.mode==='ALL')return {sql:'',params:[] as any[]};
  return {sql:` AND ${alias}.branch_id=ANY($${startParam}::bigint[])`,params:[access.branchIds]};
}
