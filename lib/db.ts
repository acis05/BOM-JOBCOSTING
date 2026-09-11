import { Pool, QueryResultRow } from 'pg';

declare global { var __bomPool: Pool | undefined; }

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL belum tersedia. Fitur yang membutuhkan database tidak akan berjalan.');
}

export const pool = global.__bomPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  // Railway private Postgres already uses an internal trusted network.
  // Do not force SSL here; respect the connection string supplied by Railway.
  max: 5,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

if (process.env.NODE_ENV !== 'production') global.__bomPool = pool;

export async function query<T extends QueryResultRow = QueryResultRow>(text:string, params:unknown[]=[]){
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL belum di-set');
  return pool.query<T>(text, params);
}
