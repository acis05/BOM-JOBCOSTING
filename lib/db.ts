import { Pool, QueryResultRow } from 'pg';

declare global { var __bomPool: Pool | undefined; }
export const pool = global.__bomPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : undefined,
  max: 5,
});
if (process.env.NODE_ENV !== 'production') global.__bomPool = pool;
export async function query<T extends QueryResultRow = QueryResultRow>(text:string, params:unknown[]=[]){ return pool.query<T>(text, params); }
