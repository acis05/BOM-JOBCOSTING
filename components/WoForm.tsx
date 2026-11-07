'use client';

import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';

type Opt={id:number|string;bom_no?:string;name:string};
type Acc={account_no:string;name:string};
type MaterialLine={itemNo:string;itemName:string;qty:string;unit:string};
type CostLine={costName:string;accountNo:string;amount:string};

const fm=(v:any)=>{const n=Number(String(v??'').replace(/\D/g,''));return n?new Intl.NumberFormat('id-ID').format(n):''};
const raw=(v:string)=>v.replace(/\D/g,'');
function dval(v:any){if(!v)return new Date().toISOString().slice(0,10);const s=String(v);const m=s.match(/^(\d{4}-\d{2}-\d{2})/);if(m)return m[1];const d=new Date(v);return Number.isNaN(d.getTime())?new Date().toISOString().slice(0,10):d.toISOString().slice(0,10)}
function positiveNumber(v:any){const n=Number(v);return Number.isFinite(n)&&n>0?n:0}

export default function WoForm({boms,warehouses=[],branches=[],accounts=[],initial,id}:{boms:any[];warehouses?:Opt[];branches?:any[];accounts?:Acc[];initial?:any;id?:string}){
  const r=useRouter();
  const initialPlanned=initial?.planned_qty!=null?String(initial.planned_qty):'1';
  const [b,setB]=useState({
    woNo:initial?.wo_no||'',
    bomId:String(initial?.bom_id||boms[0]?.id||''),
    plannedQty:initialPlanned,
    warehouseName:initial?.warehouse_name||'',
    branchId:String(initial?.branch_id||''),
    branchName:initial?.branch_name||'',
    woDate:dval(initial?.wo_date),
    notes:initial?.notes||''
  });
  const [mats,setMats]=useState<MaterialLine[]>((initial?.materials||[]).map((m:any)=>({itemNo:m.item_no,itemName:m.item_name,qty:String(m.qty),unit:m.unit||''})));
  const [costs,setCosts]=useState<CostLine[]>((initial?.costs||[]).map((x:any)=>({costName:x.cost_name,accountNo:x.account_no||'',amount:String(x.amount||0)})));
  const [msg,setMsg]=useState('');
  const lastValidQty=useRef(positiveNumber(initial?.planned_qty)||1);
  const loadedBom=useRef('');

  async function loadBom(bomId:string){
    if(!bomId)return;
    setMsg('Memuat formula BOM...');
    const x=await fetch(`/api/boms/${bomId}`);
    const j=await x.json();
    if(!x.ok){setMsg(j.error||'BOM gagal dimuat');return;}
    const planned=positiveNumber(b.plannedQty)||1;
    const output=positiveNumber(j.output_qty)||1;
    const scale=planned/output;
    setMats((j.materials||[]).map((m:any)=>({itemNo:m.item_no,itemName:m.item_name,qty:String(Number(m.qty||0)*scale),unit:m.unit||''})));
    setCosts((j.costs||[]).map((k:any)=>({costName:k.cost_name||accounts.find(a=>a.account_no===k.account_no)?.name||'',accountNo:k.account_no||'',amount:String(Number(k.amount||0)*scale)})));
    lastValidQty.current=planned;
    loadedBom.current=bomId;
    setMsg('');
  }

  // WO baru: saat BOM berubah, ambil nilai dasar BOM lalu kalikan dengan Planned Qty saat itu.
  useEffect(()=>{
    if(!id&&b.bomId&&loadedBom.current!==b.bomId)loadBom(b.bomId);
  },[b.bomId,id]);

  // New maupun Edit: perubahan Planned Qty mengalikan nilai yang sedang terlihat tepat satu kali.
  // Kalau field dikosongkan sementara, tidak ada perhitungan sampai angka valid (>0) dimasukkan lagi.
  useEffect(()=>{
    const now=positiveNumber(b.plannedQty);
    const prev=lastValidQty.current;
    if(!now||!prev||now===prev)return;
    const ratio=now/prev;
    setMats(lines=>lines.map(m=>({...m,qty:String(Number(m.qty||0)*ratio)})));
    setCosts(lines=>lines.map(k=>({...k,amount:String(Number(k.amount||0)*ratio)})));
    lastValidQty.current=now;
  },[b.plannedQty]);

  async function save(){
    const planned=positiveNumber(b.plannedQty);
    if(!planned){setMsg('Planned Qty harus lebih besar dari 0.');return;}
    if(!b.bomId){setMsg('Pilih BOM terlebih dahulu.');return;}
    setMsg('Menyimpan...');
    const body={...b,plannedQty:String(planned),materials:mats,costs};
    const x=await fetch(id?`/api/work-orders/${id}`:'/api/work-orders',{method:id?'PUT':'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const j=await x.json();
    if(!x.ok){setMsg(j.error||'Gagal');return;}
    r.push('/work-orders');
    r.refresh();
  }

  return <div className="stack">
    <div className="card grid two">
      <label>WO No<input className="input" value={b.woNo} onChange={e=>setB({...b,woNo:e.target.value})}/></label>
      <label>BOM<select className="select" value={b.bomId} disabled={!!id} onChange={e=>setB({...b,bomId:e.target.value})}>{boms.map(x=><option key={x.id} value={x.id}>{x.bom_no} — {x.name}</option>)}</select></label>
      <label>Planned Qty<input className="input" type="number" min="0.0001" step="0.0001" value={b.plannedQty} onChange={e=>setB({...b,plannedQty:e.target.value})}/></label>
      <label>WO Date<input className="input" type="date" value={b.woDate} onChange={e=>setB({...b,woDate:e.target.value})}/></label>
      <label>Gudang<select className="select" value={b.warehouseName} onChange={e=>setB({...b,warehouseName:e.target.value})}><option value="">-- pilih gudang --</option>{warehouses.map(x=><option key={x.id} value={x.name}>{x.name}</option>)}</select></label>
      <label>Cabang Accurate<select className="select" value={b.branchId} onChange={e=>{const x=branches.find(z=>String(z.accurate_id)===e.target.value);setB({...b,branchId:e.target.value,branchName:x?.name||''})}}><option value="">-- pilih cabang --</option>{branches.map(x=><option key={x.accurate_id} value={x.accurate_id}>{x.name}</option>)}</select></label>
      <label className="span2">Catatan<textarea className="input" value={b.notes} onChange={e=>setB({...b,notes:e.target.value})}/></label>
    </div>
    <div className="card"><h2>Material WO</h2>{mats.map((m,i)=><div className="grid two" key={`${m.itemNo}-${i}`}><div><b>{m.itemNo}</b><div className="small muted">{m.itemName} · {m.unit}</div></div><input className="input" type="number" step="0.0001" value={m.qty} onChange={e=>{const x=[...mats];x[i]={...m,qty:e.target.value};setMats(x)}}/></div>)}</div>
    <div className="card"><h2>Biaya WO</h2>{costs.map((k,i)=><div className="grid three" key={`${k.accountNo}-${i}`}><input className="input" value={k.costName} onChange={e=>{const x=[...costs];x[i]={...k,costName:e.target.value};setCosts(x)}}/><select className="select" value={k.accountNo} onChange={e=>{const a=accounts.find(z=>z.account_no===e.target.value);const x=[...costs];x[i]={...k,accountNo:e.target.value,costName:k.costName.trim()?k.costName:(a?.name||'')};setCosts(x)}}><option value="">-- pilih akun --</option>{accounts.map(a=><option key={a.account_no} value={a.account_no}>{a.account_no} — {a.name}</option>)}</select><input className="input" inputMode="numeric" value={fm(k.amount)} onChange={e=>{const x=[...costs];x[i]={...k,amount:raw(e.target.value)};setCosts(x)}}/></div>)}</div>
    <div className="row"><button className="btn green" onClick={save}>{id?'Update WO':'Simpan WO'}</button>{msg&&<span className="muted">{msg}</span>}</div>
  </div>;
}
