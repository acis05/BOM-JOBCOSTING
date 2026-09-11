import crypto from 'crypto';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {query} from '@/lib/db';
import type {PermissionKey} from '@/lib/permissions';

export function hashPassword(password:string,salt=crypto.randomBytes(16).toString('hex')){
  const hash=crypto.scryptSync(password,salt,64).toString('hex');
  return `${salt}:${hash}`;
}
export function verifyPassword(password:string,stored:string){
  const [salt,hash]=String(stored||'').split(':'); if(!salt||!hash)return false;
  const test=crypto.scryptSync(password,salt,64); const expected=Buffer.from(hash,'hex');
  return expected.length===test.length&&crypto.timingSafeEqual(expected,test);
}
export function tokenHash(token:string){return crypto.createHash('sha256').update(token).digest('hex')}

export async function createSession(userId:number){
  const token=crypto.randomBytes(32).toString('hex'); const h=tokenHash(token);
  await query(`INSERT INTO app_sessions(token_hash,user_id,expires_at) VALUES($1,$2,NOW()+INTERVAL '30 days')`,[h,userId]);
  const jar=await cookies(); jar.set('bom_session',token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*24*30});
}
export async function destroySession(){
  const jar=await cookies(); const token=jar.get('bom_session')?.value;
  if(token) await query('DELETE FROM app_sessions WHERE token_hash=$1',[tokenHash(token)]).catch(()=>{});
  jar.delete('bom_session');
}
export async function getCurrentUser(){
  const jar=await cookies(); const token=jar.get('bom_session')?.value; if(!token)return null;
  const r=await query<any>(`SELECT u.id,u.username,u.display_name,u.active FROM app_sessions s JOIN app_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>NOW() AND u.active=TRUE LIMIT 1`,[tokenHash(token)]);
  const u=r.rows[0]; if(!u)return null;
  const p=await query<any>(`SELECT DISTINCT rp.permission_key FROM app_user_roles ur JOIN app_role_permissions rp ON rp.role_id=ur.role_id WHERE ur.user_id=$1`,[u.id]);
  return {...u,permissions:p.rows.map((x:any)=>String(x.permission_key)) as string[]};
}
export async function requirePagePermission(permission:PermissionKey){
  const u=await getCurrentUser(); if(!u)redirect('/login'); if(!u.permissions.includes(permission))redirect('/forbidden'); return u;
}

export async function requireAnyApiPermission(permissions:PermissionKey[]){
  const u=await getCurrentUser();if(!u)return {ok:false as const,response:Response.json({error:'Silakan login terlebih dahulu.'},{status:401})};
  if(!permissions.some(p=>u.permissions.includes(p)))return {ok:false as const,response:Response.json({error:'Anda tidak memiliki hak akses untuk fitur ini.'},{status:403})};
  return {ok:true as const,user:u};
}

export async function requireApiPermission(permission:PermissionKey){
  const u=await getCurrentUser(); if(!u)return {ok:false as const,response:Response.json({error:'Silakan login terlebih dahulu.'},{status:401})};
  if(!u.permissions.includes(permission))return {ok:false as const,response:Response.json({error:'Anda tidak memiliki hak akses untuk fitur ini.'},{status:403})};
  return {ok:true as const,user:u};
}
