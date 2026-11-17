import Header from '@/components/Header';
import AccessManager from '@/components/AccessManager';
import {query} from '@/lib/db';
import {requirePagePermission} from '@/lib/auth';
import {PERMISSIONS} from '@/lib/permissions';
export const dynamic='force-dynamic';
export default async function Page(){
  const u=await requirePagePermission('access.manage');
  const [rr,pr,ur,br,uba]=await Promise.all([
    query<any>('SELECT id,COALESCE(display_name,name) name FROM app_roles WHERE organization_id=$1 ORDER BY COALESCE(display_name,name)',[u.organization_id]),
    query<any>('SELECT role_id,permission_key FROM app_role_permissions WHERE role_id IN (SELECT id FROM app_roles WHERE organization_id=$1)',[u.organization_id]),
    query<any>(`SELECT u.id,u.username,u.display_name,u.active,COALESCE(u.branch_access_mode,'ALL') branch_access_mode,(SELECT role_id FROM app_user_roles x WHERE x.user_id=u.id LIMIT 1) role_id FROM app_users u WHERE u.organization_id=$1 ORDER BY u.username`,[u.organization_id]),
    query<any>('SELECT accurate_id,name FROM branches_cache WHERE organization_id=$1 ORDER BY name',[u.organization_id]),
    query<any>(`SELECT a.user_id,a.branch_accurate_id FROM app_user_branch_access a JOIN app_users u ON u.id=a.user_id WHERE u.organization_id=$1`,[u.organization_id])
  ]);
  const roles=rr.rows.map((x:any)=>({...x,permissions:pr.rows.filter((p:any)=>Number(p.role_id)===Number(x.id)).map((p:any)=>String(p.permission_key))}));
  const users=ur.rows.map((x:any)=>({...x,branch_ids:uba.rows.filter((z:any)=>Number(z.user_id)===Number(x.id)).map((z:any)=>Number(z.branch_accurate_id))}));
  return <><Header title="Hak Akses" subtitle={`Atur user, role & akses cabang. Maksimal ${u.max_users||5} user aktif.`}/><AccessManager roles={roles} users={users} permissions={PERMISSIONS.map(([key,label])=>({key,label}))} branches={br.rows}/></>
}
