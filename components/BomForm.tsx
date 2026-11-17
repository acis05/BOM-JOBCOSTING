'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';

type Item={item_no:string;name:string;unit?:string};
type Acc={account_no:string;name:string};
const moneyNumber=(v:any)=>{if(typeof v==='number')return Number.isFinite(v)?v:0;const s=String(v??'').trim();if(!s)return 0;if(/^-?\d+(?:\.\d+)?$/.test(s)){const n=Number(s);return Number.isFinite(n)?n:0}const n=Number(s.replace(/\./g,'').replace(',', '.').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0};
const fm=(v:any)=>{const n=moneyNumber(v);if(!n)return '';return new Intl.NumberFormat('id-ID',{minimumFractionDigits:0,maximumFractionDigits:Number.isInteger(n)?0:2}).format(n)};
const raw=(v:string)=>String(Math.round(moneyNumber(v)));
const qtyText=(v:any)=>{const n=Number(v);if(!Number.isFinite(n))return '';return Number.isInteger(n)?String(n):String(Number(n.toFixed(4)))};

export default function BomForm({items,accounts,initial,id}:{items:Item[];accounts:Acc[];initial?:any;id?:string}){
  const r=useRouter();
  const[b,setB]=useState({bomNo:initial?.bom_no||'',name:initial?.name||'',productItemNo:initial?.product_item_no||'',productName:initial?.product_name||'',productUnit:initial?.product_unit||'',outputQty:qtyText(initial?.output_qty??1),notes:initial?.notes||''});
  const[materials,setMaterials]=useState((initial?.materials||[{item_no:'',item_name:'',qty:1,unit:''}]).map((m:any)=>({itemNo:m.item_no||m.itemNo||'',itemName:m.item_name||m.itemName||'',qty:qtyText(m.qty??1),unit:m.unit||'',detailNotes:m.detail_notes||m.detailNotes||'',departmentName:m.department_name||m.departmentName||'',projectNo:m.project_no||m.projectNo||''})));
  const[costs,setCosts]=useState((initial?.costs||[{cost_name:'Labor',account_no:'',amount:0}]).map((x:any)=>({costName:x.cost_name||x.costName||'',accountNo:x.account_no||x.accountNo||'',amount:String(moneyNumber(x.amount||0)),expenseNotes:x.expense_notes||x.expenseNotes||'',departmentName:x.department_name||x.departmentName||'',projectNo:x.project_no||x.projectNo||''})));
  const[msg,setMsg]=useState('');
  function pickProduct(no:string){const x=items.find(i=>i.item_no===no);setB({...b,productItemNo:no,productName:x?.name||'',productUnit:x?.unit||''})}
  async function save(e:React.FormEvent){e.preventDefault();setMsg('Menyimpan...');const res=await fetch(id?`/api/boms/${id}`:'/api/boms',{method:id?'PUT':'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...b,materials,costs})});const j=await res.json();if(!res.ok)return setMsg(j.error||'Gagal');r.push('/boms');r.refresh()}
  return <form onSubmit={save} className="stack">
    <div className="card grid two">
      <label>BOM No<input className="input" value={b.bomNo} onChange={e=>setB({...b,bomNo:e.target.value})}/></label>
      <label>Nama Formula<input className="input" value={b.name} onChange={e=>setB({...b,name:e.target.value})}/></label>
      <label>Barang Jadi<select className="select" value={b.productItemNo} onChange={e=>pickProduct(e.target.value)}><option value="">-- pilih barang Accurate --</option>{items.map(x=><option key={x.item_no} value={x.item_no}>{x.item_no} — {x.name}</option>)}</select></label>
      <label>Nama Barang Jadi<input className="input" value={b.productName} readOnly/></label>
      <label>Satuan Barang Jadi<input className="input" value={b.productUnit} readOnly placeholder="Dari Accurate"/></label>
      <label>Output Qty<input className="input" type="number" step="0.0001" value={b.outputQty} onChange={e=>setB({...b,outputQty:e.target.value})}/></label>
      <label className="span2">Catatan<textarea className="input" value={b.notes} onChange={e=>setB({...b,notes:e.target.value})}/></label>
    </div>
    <div className="card"><h2>Bahan Baku</h2>
      {materials.map((m:any,i:number)=><div className="card" style={{marginBottom:10}} key={i}>
        <div className="grid two">
          <label>Item<select className="select" value={m.itemNo} onChange={e=>{const it=items.find(x=>x.item_no===e.target.value);const x=[...materials];x[i]={...m,itemNo:e.target.value,itemName:it?.name||'',unit:it?.unit||''};setMaterials(x)}}><option value="">-- pilih barang --</option>{items.map(x=><option key={x.item_no} value={x.item_no}>{x.item_no} — {x.name}</option>)}</select></label>
          <label>Nama<input className="input" value={m.itemName} readOnly/></label>
          <label>Qty<input className="input" type="number" step="0.0001" value={m.qty} onChange={e=>{const x=[...materials];x[i]={...m,qty:e.target.value};setMaterials(x)}}/></label>
          <label>Satuan<input className="input" value={m.unit} readOnly placeholder="Dari Accurate"/></label>
          <label className="span2">Keterangan Detail<input className="input" value={m.detailNotes} onChange={e=>{const x=[...materials];x[i]={...m,detailNotes:e.target.value};setMaterials(x)}} placeholder="Opsional"/></label>
          <label>Departemen<input className="input" value={m.departmentName} onChange={e=>{const x=[...materials];x[i]={...m,departmentName:e.target.value};setMaterials(x)}} placeholder="Opsional - nama departemen Accurate"/></label>
          <label>Project<input className="input" value={m.projectNo} onChange={e=>{const x=[...materials];x[i]={...m,projectNo:e.target.value};setMaterials(x)}} placeholder="Opsional - nomor project Accurate"/></label>
        </div>
        <button type="button" className="btn red" onClick={()=>setMaterials(materials.filter((_:any,j:number)=>j!==i))}>Hapus Bahan</button>
      </div>)}
      <button type="button" className="btn secondary" onClick={()=>setMaterials([...materials,{itemNo:'',itemName:'',qty:'1',unit:'',detailNotes:'',departmentName:'',projectNo:''}])}>+ Bahan</button>
    </div>
    <div className="card"><h2>Biaya Lain</h2>
      {costs.map((k:any,i:number)=><div className="card" style={{marginBottom:10}} key={i}>
        <div className="grid two">
          <label>Nama Biaya<input className="input" value={k.costName} placeholder="Nama biaya" onChange={e=>{const x=[...costs];x[i]={...k,costName:e.target.value};setCosts(x)}}/></label>
          <label>Akun<select className="select" value={k.accountNo} onChange={e=>{const a=accounts.find(z=>z.account_no===e.target.value);const x=[...costs];x[i]={...k,accountNo:e.target.value,costName:k.costName.trim()?k.costName:(a?.name||'')};setCosts(x)}}><option value="">-- pilih akun Accurate --</option>{accounts.map(a=><option key={a.account_no} value={a.account_no}>{a.account_no} — {a.name}</option>)}</select></label>
          <label>Jumlah<input className="input" inputMode="numeric" value={fm(k.amount)} onChange={e=>{const x=[...costs];x[i]={...k,amount:raw(e.target.value)};setCosts(x)}}/></label>
          <label>Keterangan Detail<input className="input" value={k.expenseNotes} onChange={e=>{const x=[...costs];x[i]={...k,expenseNotes:e.target.value};setCosts(x)}} placeholder="Opsional"/></label>
          <label>Departemen<input className="input" value={k.departmentName} onChange={e=>{const x=[...costs];x[i]={...k,departmentName:e.target.value};setCosts(x)}} placeholder="Opsional - nama departemen Accurate"/></label>
          <label>Project<input className="input" value={k.projectNo} onChange={e=>{const x=[...costs];x[i]={...k,projectNo:e.target.value};setCosts(x)}} placeholder="Opsional - disimpan di aplikasi"/></label>
        </div>
        <button type="button" className="btn red" onClick={()=>setCosts(costs.filter((_:any,j:number)=>j!==i))}>Hapus Biaya</button>
      </div>)}
      <button type="button" className="btn secondary" onClick={()=>setCosts([...costs,{costName:'',accountNo:'',amount:'0',expenseNotes:'',departmentName:'',projectNo:''}])}>+ Biaya</button>
    </div>
    <div className="row"><button className="btn green">{id?'Update BOM':'Simpan BOM'}</button>{msg&&<span className="muted">{msg}</span>}</div>
  </form>
}
