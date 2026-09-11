'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';

type Role={id:number;name:string;permissions:string[]};
type User={id:number;username:string;display_name:string;active:boolean;role_id:number|null};
type Perm={key:string;label:string};

export default function AccessManager({roles:initialRoles,users:initialUsers,permissions}:{roles:Role[];users:User[];permissions:Perm[]}){
 const r=useRouter();const[roles,setRoles]=useState<Role[]>(initialRoles);const[users,setUsers]=useState<User[]>(initialUsers);const[msg,setMsg]=useState('');
 const[newRole,setNewRole]=useState('');const[newUser,setNewUser]=useState({username:'',displayName:'',password:'',roleId:String(initialRoles[0]?.id||'')});
 async function api(url:string,method:string,body:any){setMsg('Menyimpan...');const x=await fetch(url,{method,headers:{'content-type':'application/json'},body:JSON.stringify(body)});const j=await x.json();if(!x.ok){setMsg(j.error||'Gagal');return null}setMsg('Berhasil');r.refresh();return j}
 async function createRole(){if(!newRole.trim())return;const j=await api('/api/access/roles','POST',{name:newRole});if(j){setRoles([...roles,{id:j.id,name:j.name,permissions:[]}]);setNewRole('')}}
 async function saveRole(role:Role){await api(`/api/access/roles/${role.id}`,'PUT',{permissions:role.permissions})}
 function toggle(roleId:number,key:string){setRoles(roles.map(x=>x.id===roleId?{...x,permissions:x.permissions.includes(key)?x.permissions.filter(p=>p!==key):[...x.permissions,key]}:x))}
 async function createUser(){const j=await api('/api/access/users','POST',{...newUser,roleId:Number(newUser.roleId)});if(j){setUsers([...users,{id:j.id,username:j.username,display_name:j.display_name,active:true,role_id:Number(newUser.roleId)}]);setNewUser({username:'',displayName:'',password:'',roleId:String(initialRoles[0]?.id||'')})}}
 async function updateUser(u:User,patch:any){await api(`/api/access/users/${u.id}`,'PUT',patch)}
 return <div className="stack">
  <div className="card"><h2 className="section-title">Role & Hak Akses</h2><div className="row wrap" style={{marginBottom:16}}><input className="input" style={{maxWidth:320}} placeholder="Nama role baru" value={newRole} onChange={e=>setNewRole(e.target.value)}/><button className="btn" onClick={createRole}>+ Role</button></div>
  {roles.map(role=><div key={role.id} className="card" style={{marginBottom:14,boxShadow:'none'}}><div className="row" style={{justifyContent:'space-between'}}><b>{role.name}</b><button className="btn green compact" onClick={()=>saveRole(role)}>Simpan Hak Akses</button></div><div className="perm-grid" style={{marginTop:12}}>{permissions.map(p=><label key={p.key} className="perm-item"><input type="checkbox" checked={role.permissions.includes(p.key)} onChange={()=>toggle(role.id,p.key)}/> <span>{p.label}</span></label>)}</div></div>)}</div>
  <div className="card"><h2 className="section-title">User</h2><div className="grid four" style={{marginBottom:14}}><input className="input" placeholder="Username" value={newUser.username} onChange={e=>setNewUser({...newUser,username:e.target.value})}/><input className="input" placeholder="Nama" value={newUser.displayName} onChange={e=>setNewUser({...newUser,displayName:e.target.value})}/><input className="input" type="password" placeholder="Password" value={newUser.password} onChange={e=>setNewUser({...newUser,password:e.target.value})}/><select className="select" value={newUser.roleId} onChange={e=>setNewUser({...newUser,roleId:e.target.value})}>{roles.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div><button className="btn green" onClick={createUser}>+ Tambah User</button>
  <table className="table" style={{marginTop:16}}><thead><tr><th>User</th><th>Nama</th><th>Role</th><th>Aktif</th><th>Reset Password</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td>{u.username}</td><td>{u.display_name}</td><td><select className="select" value={String(u.role_id||'')} onChange={async e=>{const roleId=Number(e.target.value);setUsers(users.map(x=>x.id===u.id?{...x,role_id:roleId}:x));await updateUser(u,{roleId})}}>{roles.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></td><td><input type="checkbox" checked={u.active} onChange={async e=>{const active=e.target.checked;setUsers(users.map(x=>x.id===u.id?{...x,active}:x));await updateUser(u,{active})}}/></td><td><button className="btn secondary compact" onClick={async()=>{const p=prompt('Password baru minimal 6 karakter');if(p)await updateUser(u,{password:p})}}>Reset</button></td></tr>)}</tbody></table></div>
  {msg&&<div className="notice">{msg}</div>}
 </div>
}
