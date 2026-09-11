'use client';
import {useEffect,useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';

type MaterialLine={itemNo:string;itemName:string;qty:string;unit:string};
type CostLine={costName:string;accountNo:string;amount:string};
type BomOption={id:number|string;bom_no:string;name:string};
type WarehouseOption={id?:number|string;name:string};

type WoState={
  woNo:string;
  bomId:string;
  plannedQty:string;
  warehouseName:string;
  woDate:string;
  notes:string;
};

export default function WoForm({boms,warehouses=[],initial,id}:{boms:BomOption[];warehouses?:WarehouseOption[];initial?:any;id?:string}){
 const r=useRouter();
 const[b,setB]=useState<WoState>({
   woNo:initial?.wo_no||'',
   bomId:String(initial?.bom_id||boms[0]?.id||''),
   plannedQty:String(initial?.planned_qty||1),
   warehouseName:initial?.warehouse_name||warehouses[0]?.name||'',
   woDate:initial?String(initial.wo_date).slice(0,10):new Date().toISOString().slice(0,10),
   notes:initial?.notes||''
 });
 const[materials,setMaterials]=useState<MaterialLine[]>((initial?.materials||[]).map((m:any)=>({itemNo:m.item_no,itemName:m.item_name,qty:String(m.qty),unit:m.unit||''})));
 const[costs,setCosts]=useState<CostLine[]>((initial?.costs||[]).map((k:any)=>({costName:k.cost_name,accountNo:k.account_no||'',amount:String(k.amount)})));
 const[formulaInfo,setFormulaInfo]=useState<{outputQty:number;productItemNo:string;productName:string}|null>(initial?{outputQty:Number(initial.output_qty||1),productItemNo:initial.product_item_no||'',productName:initial.product_name||''}:null);
 const[loadingFormula,setLoadingFormula]=useState(false);
 const[msg,setMsg]=useState('');

 useEffect(()=>{
   if(id||!b.bomId){return;}
   let cancelled=false;
   async function loadFormula(){
     setLoadingFormula(true);
     try{
       const res=await fetch(`/api/boms/${encodeURIComponent(b.bomId)}`,{cache:'no-store'});
       const j=await res.json();
       if(!res.ok) throw new Error(j.error||'BOM tidak dapat dibaca');
       if(cancelled)return;
       const outputQty=Number(j.output_qty||1) || 1;
       const planned=Number(b.plannedQty||0);
       const scale=planned/outputQty;
       setFormulaInfo({outputQty,productItemNo:j.product_item_no||'',productName:j.product_name||j.name||''});
       setMaterials((j.materials||[]).map((m:any):MaterialLine=>({
         itemNo:String(m.item_no||''),
         itemName:String(m.item_name||m.item_no||''),
         qty:String(Number(m.qty||0)*scale),
         unit:String(m.unit||'')
       })));
       setCosts((j.costs||[]).map((k:any):CostLine=>({
         costName:String(k.cost_name||''),
         accountNo:String(k.account_no||''),
         amount:String(Number(k.amount||0)*scale)
       })));
     }catch(e:any){
       if(!cancelled){setMaterials([]);setCosts([]);setFormulaInfo(null);setMsg(e.message||'Gagal membaca BOM');}
     }finally{if(!cancelled)setLoadingFormula(false)}
   }
   loadFormula();
   return()=>{cancelled=true};
 },[b.bomId,b.plannedQty,id]);

 const totalCost=useMemo(()=>costs.reduce((s: number,k:CostLine)=>s+Number(k.amount||0),0),[costs]);

 async function save(){
   setMsg(id?'Menyimpan perubahan...':'Membuat WO...');
   const payload=id?{...b,materials,costs}:b;
   const res=await fetch(id?`/api/work-orders/${id}`:'/api/work-orders',{method:id?'PUT':'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
   const j=await res.json();
   if(!res.ok)return setMsg(j.error||'Gagal');
   r.push('/work-orders');r.refresh();
 }

 return <div className="stack">
  <div className="card" style={{maxWidth:900}}><div className="stack">
   <label>WO No<input className="input" value={b.woNo} onChange={e=>setB({...b,woNo:e.target.value})} placeholder="WO-0001"/></label>
   {!id&&<label>BOM<select className="select" value={b.bomId} onChange={e=>setB({...b,bomId:e.target.value})}>{boms.map((x:BomOption)=><option key={x.id} value={x.id}>{x.bom_no} — {x.name}</option>)}</select></label>}
   <div className="grid two"><label>Planned Qty<input className="input" type="number" step="0.0001" min="0" value={b.plannedQty} onChange={e=>setB({...b,plannedQty:e.target.value})}/></label><label>WO Date<input className="input" type="date" value={b.woDate} onChange={e=>setB({...b,woDate:e.target.value})}/></label></div>
   <label>Gudang<select className="select" value={b.warehouseName} onChange={e=>setB({...b,warehouseName:e.target.value})}><option value="">-- pilih gudang --</option>{warehouses.map((x:WarehouseOption)=><option key={x.id||x.name} value={x.name}>{x.name}</option>)}</select></label>
   <label>Catatan<textarea className="textarea" value={b.notes} onChange={e=>setB({...b,notes:e.target.value})}/></label>
  </div></div>

  {!id&&<div className="card">
   <div className="row wrap" style={{justifyContent:'space-between',alignItems:'flex-start'}}>
    <div><h2 className="section-title" style={{marginBottom:4}}>Rincian Formula untuk WO</h2><div className="small muted">Otomatis dihitung dari BOM × Planned Qty.</div></div>
    {formulaInfo&&<div className="small"><b>Barang Jadi:</b> {formulaInfo.productItemNo} — {formulaInfo.productName}<br/><span className="muted">Basis BOM: {formulaInfo.outputQty}</span></div>}
   </div>
   {loadingFormula?<div className="muted" style={{padding:'18px 0'}}>Menghitung rincian BOM...</div>:<>
    <h3 style={{marginTop:20,marginBottom:8}}>Bahan Baku</h3>
    <table className="table"><thead><tr><th>No Barang</th><th>Nama Barang</th><th style={{textAlign:'right'}}>Qty Kebutuhan</th><th>Unit</th></tr></thead><tbody>
     {materials.length?materials.map((m:MaterialLine,i:number)=><tr key={`${m.itemNo}-${i}`}><td className="code">{m.itemNo}</td><td>{m.itemName}</td><td style={{textAlign:'right'}}><b>{Number(m.qty).toLocaleString('id-ID',{maximumFractionDigits:4})}</b></td><td>{m.unit||'-'}</td></tr>):<tr><td colSpan={4} className="muted">Belum ada bahan baku pada BOM ini.</td></tr>}
    </tbody></table>
    <h3 style={{marginTop:22,marginBottom:8}}>Biaya</h3>
    <table className="table"><thead><tr><th>Nama Biaya</th><th>No Akun</th><th style={{textAlign:'right'}}>Jumlah</th></tr></thead><tbody>
     {costs.length?costs.map((k:CostLine,i:number)=><tr key={`${k.costName}-${i}`}><td>{k.costName}</td><td className="code">{k.accountNo||'-'}</td><td style={{textAlign:'right'}}>Rp {Number(k.amount).toLocaleString('id-ID',{maximumFractionDigits:2})}</td></tr>):<tr><td colSpan={3} className="muted">Belum ada biaya tambahan pada BOM ini.</td></tr>}
    </tbody><tfoot>{costs.length>0&&<tr><td colSpan={2}><b>Total Biaya Tambahan</b></td><td style={{textAlign:'right'}}><b>Rp {totalCost.toLocaleString('id-ID',{maximumFractionDigits:2})}</b></td></tr>}</tfoot></table>
   </>}
  </div>}

  {id&&<>
   <div className="card"><h2 className="section-title">Material WO</h2>{materials.map((m:MaterialLine,i:number)=><div className="grid wo-detail-grid" key={i}><div><b>{m.itemNo}</b><div className="small muted">{m.itemName}</div></div><input className="input" type="number" step="0.0001" value={m.qty} onChange={e=>{const x=[...materials];x[i]={...m,qty:e.target.value};setMaterials(x)}}/><input className="input" value={m.unit} onChange={e=>{const x=[...materials];x[i]={...m,unit:e.target.value};setMaterials(x)}}/></div>)}</div>
   <div className="card"><h2 className="section-title">Biaya WO</h2>{costs.map((k:CostLine,i:number)=><div className="grid three" key={i}><input className="input" value={k.costName} onChange={e=>{const x=[...costs];x[i]={...k,costName:e.target.value};setCosts(x)}}/><input className="input" value={k.accountNo} onChange={e=>{const x=[...costs];x[i]={...k,accountNo:e.target.value};setCosts(x)}}/><input className="input" type="number" step="0.01" value={k.amount} onChange={e=>{const x=[...costs];x[i]={...k,amount:e.target.value};setCosts(x)}}/></div>)}</div>
  </>}

  <div className="row"><button className="btn green" onClick={save}>{id?'Update WO':'Create WO from BOM'}</button>{msg&&<div className="muted">{msg}</div>}</div>
 </div>
}
