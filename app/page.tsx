import {requirePagePermission} from '@/lib/auth';
import {query} from '@/lib/db';
import Header from '@/components/Header';
export const dynamic='force-dynamic';

export default async function Page(){const user=await requirePagePermission('dashboard.view');const org=user.organization_id;
  let dbOk=true; let error='';
  let bomCount='0', draftCount='0', submittedCount='0', approvedCount='0'; let rows:any[]=[];
  try{
    const [b,d,s,a,r]=await Promise.all([
      query<any>(`SELECT COUNT(*) c FROM boms WHERE status='ACTIVE' AND organization_id=$1`,[org]),
      query<any>(`SELECT COUNT(*) c FROM work_orders WHERE status='DRAFT' AND organization_id=$1`,[org]),
      query<any>(`SELECT COUNT(*) c FROM work_orders WHERE status='SUBMITTED' AND organization_id=$1`,[org]),
      query<any>(`SELECT COUNT(*) c FROM work_orders WHERE status IN ('APPROVED','SYNCED','ROLLED_OVER','ROLLOVER_ERROR') AND organization_id=$1`,[org]),
      query<any>(`SELECT * FROM work_orders WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 8`,[org])
    ]);
    bomCount=b.rows[0].c; draftCount=d.rows[0].c; submittedCount=s.rows[0].c; approvedCount=a.rows[0].c; rows=r.rows;
  }catch(e:any){dbOk=false;error=e?.message||'Database belum siap';}
  return <><Header title="Dashboard" subtitle="BOM → WO → Approval → Accurate Job Costing"/>
    {!dbOk&&<div className="card" style={{marginBottom:16,borderColor:'#f59e0b'}}><b>Database belum siap</b><div className="muted" style={{marginTop:6}}>Aplikasi sudah online, tetapi PostgreSQL belum dapat digunakan. Cek DATABASE_URL pada Railway lalu redeploy. Detail: {error}</div></div>}
    <div className="grid cards"><div className="card"><div className="muted">BOM Active</div><div className="metric">{bomCount}</div></div><div className="card"><div className="muted">WO Draft</div><div className="metric">{draftCount}</div></div><div className="card"><div className="muted">Waiting Approval</div><div className="metric">{submittedCount}</div></div><div className="card"><div className="muted">Approved / Synced</div><div className="metric">{approvedCount}</div></div></div>
    <div className="card" style={{marginTop:16}}><h2 className="section-title">Recent Work Orders</h2><table className="table"><thead><tr><th>WO</th><th>Product</th><th>Qty</th><th>Status</th></tr></thead><tbody>{rows.length?rows.map((r:any)=><tr key={r.id}><td className="code">{r.wo_no}</td><td>{r.product_name}</td><td>{Number(r.planned_qty)}</td><td><span className={`status ${r.status}`}>{r.status}</span></td></tr>):<tr><td colSpan={4} className="muted">{dbOk?'Belum ada WO.':'Menunggu koneksi PostgreSQL.'}</td></tr>}</tbody></table></div></>;
}
