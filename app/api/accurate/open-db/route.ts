import {requireApiPermission} from '@/lib/auth';
import {getConnection} from '@/lib/accurate';import {query} from '@/lib/db';import {syncAccurateMasters} from '@/lib/accurate-sync';
export async function POST(req:Request){const auth=await requireApiPermission('accurate.connect');if(!auth.ok)return auth.response;
  const b=await req.json();const c=await getConnection();if(!c?.access_token)return Response.json({error:'Accurate Online belum terhubung'},{status:400});
  const u=new URL('https://account.accurate.id/api/open-db.do');u.searchParams.set('id',String(b.id));
  const r=await fetch(u,{headers:{Authorization:`Bearer ${c.access_token}`},cache:'no-store'});const j=await r.json();
  if(!r.ok||!j.session)return Response.json({error:j?.d?.join?.('; ')||'Database Accurate tidak dapat dibuka'},{status:400});
  await query(`UPDATE accurate_connections SET database_id=$1,database_alias=$2,api_host=$3,session_id=$4,updated_at=NOW() WHERE id=$5`,[b.id,b.alias||null,j.host,j.session,c.id]);
  try{const synced=await syncAccurateMasters();return Response.json({ok:true,database:b.alias||b.id,synced});}
  catch(e:any){return Response.json({ok:true,database:b.alias||b.id,warning:`Database terhubung, tetapi sinkronisasi master belum selesai: ${e.message}`});}
}
