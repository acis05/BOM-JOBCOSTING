import './globals.css'; import Link from 'next/link';
export const metadata={title:'BOM-JOBCOSTING AOL',description:'Dari Formula ke Job Costing Accurate Online'};
const nav=[['/','Dashboard'],['/boms','BOM / Formula'],['/work-orders','Work Orders'],['/approval','Approval'],['/accurate','Accurate Sync']];
export default function Layout({children}:{children:React.ReactNode}){return <html lang="id"><body><div className="shell"><aside className="sidebar"><img className="logo" src="/logo.png" alt="BOM-JOBCOSTING AOL"/><nav className="nav">{nav.map(([h,l])=><Link key={h} href={h}>{l}</Link>)}</nav></aside><main className="main">{children}</main></div></body></html>}
