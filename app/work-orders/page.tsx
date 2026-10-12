import {requirePagePermission} from '@/lib/auth';
import Link from 'next/link';
import Header from '@/components/Header';
import WoActions from '@/components/WoActions';
import ImportExcel from '@/components/ImportExcel';
import {query} from '@/lib/db';

export const dynamic='force-dynamic';

function shortDate(v:any){
  if(!v)return '-';
  const s=String(v);
  if(/^\d{4}-\d{2}-\d{2}/.test(s))return s.slice(0,10);
  try{return new Date(v).toISOString().slice(0,10)}catch{return s}
}

function JobStatus({x}:{x:any}){
  const jobOk=Boolean(x.accurate_job_no);
  const rolled=x.status==='ROLLED_OVER';
  const verify=x.status==='ROLLOVER_VERIFY';
  const rolloverErr=x.status==='ROLLOVER_ERROR';
  return <div style={{display:'grid',gap:5,minWidth:220}}>
    {jobOk ? <div className="small" style={{color:'#15803d',fontWeight:700}}>✓ Job Costing sudah masuk</div>
      : <div className="small muted">Job Costing belum dikirim</div>}
    {jobOk && rolled && <div className="small" style={{color:'#15803d',fontWeight:700}}>✓ Hasil Jadi sudah masuk</div>}
    {jobOk && verify && <div className="small" style={{color:'#b45309',fontWeight:700}}>⚠ Hasil Jadi perlu verifikasi</div>}
    {jobOk && rolloverErr && <div className="small danger-text" style={{fontWeight:700}}>Hasil Jadi gagal dikirim</div>}
    {x.accurate_job_no&&<div className="small muted">No. Job: {x.accurate_job_no}</div>}
    {x.accurate_rollover_no&&<div className="small muted">No. Roll Over: {x.accurate_rollover_no}</div>}
    {verify && <div className="small muted">Cek hasil jadi di Accurate. Jika sudah terbentuk, klik “Tandai Sudah Masuk”.</div>}
    {!verify && x.sync_error && <div className="small danger-text" style={{maxWidth:360,whiteSpace:'normal'}}>{x.sync_error}</div>}
    {!verify && rolloverErr && x.rollover_error && <div className="small danger-text" style={{maxWidth:360,whiteSpace:'normal'}}>Roll Over: {x.rollover_error}</div>}
  </div>
}

export default async function Page(){
  const user=await requirePagePermission('wo.view');
  const p=new Set(user.permissions);
  const access={print:p.has('wo.print'),edit:p.has('wo.edit'),delete:p.has('wo.delete'),submit:p.has('wo.edit'),approve:p.has('approval.approve'),push:p.has('accurate.push_job'),rollover:p.has('accurate.rollover')};
  const r=await query<any>('SELECT * FROM work_orders WHERE organization_id=$1 ORDER BY created_at DESC',[user.organization_id]);
  return <>
    <Header title="Work Orders" subtitle="Daftar Work Order dari formula BOM."/>
    <div className="card print-hide">
      <div className="row wrap" style={{justifyContent:'space-between'}}>
        {p.has('wo.import')?<ImportExcel endpoint="/api/import/work-orders" template="/templates/template-import-wo.xlsx"/>:<div/>}
        {p.has('wo.create')&&<Link className="btn green" href="/work-orders/new">+ New WO</Link>}
      </div>
    </div>
    <div className="card" style={{marginTop:14}}>
      <table className="table">
        <thead><tr><th>WO</th><th>Date</th><th>Product</th><th>Qty</th><th>Status</th><th className="print-hide">Action</th></tr></thead>
        <tbody>{r.rows.length?r.rows.map((x:any)=><tr key={x.id}>
          <td className="code">{x.wo_no}</td>
          <td>{shortDate(x.wo_date)}</td>
          <td>{x.product_item_no} — {x.product_name}</td>
          <td>{Number(x.planned_qty)}</td>
          <td>
            <span className={`status ${x.status}`}>{x.status==='ROLLOVER_VERIFY'?'PERLU VERIFIKASI':x.status}</span>
            <JobStatus x={x}/>
          </td>
          <td className="print-hide"><WoActions id={x.id} status={x.status} access={access}/></td>
        </tr>):<tr><td colSpan={6} className="muted">Belum ada Work Order.</td></tr>}</tbody>
      </table>
    </div>
  </>;
}
