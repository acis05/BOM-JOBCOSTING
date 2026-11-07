import pg from 'pg';
import type {QueryResultRow} from 'pg';
const {Pool}=pg;
if(!process.env.DATABASE_URL) console.warn('DATABASE_URL belum di-set');
export const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.NODE_ENV==='production'?{rejectUnauthorized:false}:undefined});
export async function query<T extends QueryResultRow=any>(text:string,params:any[]=[]){return pool.query<T>(text,params)}
