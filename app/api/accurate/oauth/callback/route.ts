import {NextResponse} from 'next/server';
import {query} from '@/lib/db';
import {publicBaseUrl} from '@/lib/accurate';
export async function GET(req:Request){
  const u=new URL(req.url); const base=publicBaseUrl(u.origin); const code=u.searchParams.get('code');
  if(!code)return NextResponse.redirect(`${base}/accurate?error=no_code`);
  const id=process.env.ACCURATE_CLIENT_ID,secret=process.env.ACCURATE_CLIENT_SECRET,redirect=process.env.ACCURATE_REDIRECT_URI;
  if(!id||!secret||!redirect)return NextResponse.redirect(`${base}/accurate?error=config`);
  const form=new URLSearchParams({code,grant_type:'authorization_code',redirect_uri:redirect});
  const res=await fetch('https://account.accurate.id/oauth/token',{method:'POST',headers:{Authorization:`Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,'Content-Type':'application/x-www-form-urlencoded'},body:form});
  const j=await res.json();
  if(!res.ok||!j.access_token)return NextResponse.redirect(`${base}/accurate?error=token`);
  const exp=new Date(Date.now()+Number(j.expires_in||1295999)*1000);
  await query('DELETE FROM accurate_connections');
  await query(`INSERT INTO accurate_connections(access_token,refresh_token,token_expires_at,scope,user_email) VALUES($1,$2,$3,$4,$5)`,[j.access_token,j.refresh_token||null,exp,j.scope||null,j.user?.email||null]);
  return NextResponse.redirect(`${base}/accurate?connected=1`);
}
