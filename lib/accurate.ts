import {query} from '@/lib/db';import {getCurrentUser} from '@/lib/auth';
export async function getConnection(){const u=await getCurrentUser();if(!u)return null;const r=await query<any>('SELECT * FROM accurate_connections WHERE organization_id=$1 ORDER BY is_active DESC,id DESC LIMIT 1',[u.organization_id]);return r.rows[0]||null}
export function publicBaseUrl(fallback?:string){if(process.env.APP_URL)return process.env.APP_URL.replace(/\/$/,'');if(process.env.ACCURATE_REDIRECT_URI){try{return new URL(process.env.ACCURATE_REDIRECT_URI).origin}catch{}}return(fallback||'http://localhost:3000').replace(/\/$/,'')}
export function oauthAuthorizeUrl(){const u=new URL('https://account.accurate.id/oauth/authorize');u.searchParams.set('client_id',process.env.ACCURATE_CLIENT_ID||'');u.searchParams.set('response_type','code');u.searchParams.set('redirect_uri',process.env.ACCURATE_REDIRECT_URI||'');u.searchParams.set('scope',process.env.ACCURATE_SCOPE||'item_view warehouse_view glaccount_view branch_view job_order_save roll_over_save');return u.toString()}
function buildAccurateDataUrl(host:string,path:string){const base=host.endsWith('/')?host:host+'/';const clean=path.replace(/^\//,'');const normalized=clean.startsWith('accurate/')?clean:`accurate/${clean}`;return new URL(normalized,base).toString()}
function tokenNeedsRefresh(c:any){if(!c?.token_expires_at)return false;const exp=new Date(c.token_expires_at).getTime();return Number.isFinite(exp)&&exp-Date.now()<=24*60*60*1000}
async function refreshConnectionToken(c:any){
 if(!c?.refresh_token)throw new Error('Sesi Accurate sudah berakhir. Silakan Putuskan Accurate lalu hubungkan kembali.');
 const id=process.env.ACCURATE_CLIENT_ID,secret=process.env.ACCURATE_CLIENT_SECRET;if(!id||!secret)throw new Error('Konfigurasi OAuth Accurate belum lengkap.');
 const form=new URLSearchParams({grant_type:'refresh_token',refresh_token:String(c.refresh_token)});
 const r=await fetch('https://account.accurate.id/oauth/token',{method:'POST',headers:{Authorization:`Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,'Content-Type':'application/x-www-form-urlencoded'},body:form,cache:'no-store'});
 const text=await r.text();let j:any;try{j=JSON.parse(text)}catch{j={raw:text}};
 if(!r.ok||!j?.access_token)throw new Error('Token Accurate tidak dapat diperbarui. Silakan Putuskan Accurate lalu Connect Accurate lagi.');
 const exp=new Date(Date.now()+Number(j.expires_in||1295999)*1000);const refresh=j.refresh_token||c.refresh_token;
 await query(`UPDATE accurate_connections SET access_token=$2,refresh_token=$3,token_expires_at=$4,scope=COALESCE($5,scope),updated_at=NOW() WHERE organization_id=$1`,[c.organization_id,j.access_token,refresh,exp,j.scope||null]);
 let updated={...c,access_token:j.access_token,refresh_token:refresh,token_expires_at:exp,scope:j.scope||c.scope};
 if(c.database_id){
   const u=new URL('https://account.accurate.id/api/open-db.do');u.searchParams.set('id',String(c.database_id));
   const or=await fetch(u,{headers:{Authorization:`Bearer ${j.access_token}`},cache:'no-store'});const ot=await or.text();let oj:any;try{oj=JSON.parse(ot)}catch{oj={raw:ot}};
   if(!or.ok||!oj?.session||!oj?.host)throw new Error('Token berhasil diperbarui tetapi database Accurate perlu dibuka ulang. Silakan pilih database Accurate kembali.');
   await query(`UPDATE accurate_connections SET api_host=$2,session_id=$3,updated_at=NOW() WHERE id=$1`,[c.id,oj.host,oj.session]);updated={...updated,api_host:oj.host,session_id:oj.session};
 }
 return updated;
}
export async function getValidConnection(forceRefresh=false){let c=await getConnection();if(!c?.access_token)return c;if(forceRefresh||tokenNeedsRefresh(c))c=await refreshConnectionToken(c);return c}
async function responseHasInvalidToken(res:Response){if(res.status===401)return true;try{const t=await res.clone().text();return /invalid_token|InvalidTokenException/i.test(t)}catch{return false}}
export async function accurateFetch(path:string,init:RequestInit={}){let c=await getValidConnection(false);if(!c?.access_token)throw new Error('Accurate Online belum terhubung');if(!c?.api_host||!c?.session_id)throw new Error('Database Accurate belum dipilih');
 const doFetch=(conn:any)=>{const url=path.startsWith('http')?path:buildAccurateDataUrl(String(conn.api_host),path);const headers=new Headers(init.headers);headers.set('Authorization',`Bearer ${conn.access_token}`);headers.set('X-Session-ID',conn.session_id);return fetch(url,{...init,headers,redirect:'follow',cache:'no-store'})};
 let res=await doFetch(c);if(await responseHasInvalidToken(res)){c=await getValidConnection(true);if(!c?.api_host||!c?.session_id)throw new Error('Database Accurate perlu dipilih kembali.');res=await doFetch(c)}return res}
export function accurateDate(v:string|Date){const d=new Date(v);return `${String(d.getUTCDate()).padStart(2,'0')}/${String(d.getUTCMonth()+1).padStart(2,'0')}/${d.getUTCFullYear()}`}
