import pg from 'pg'; const {Client}=pg;
if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL belum di-set');
const c=new Client({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL.includes('railway')?{rejectUnauthorized:false}:undefined});
await c.connect();
await c.query(`
CREATE TABLE IF NOT EXISTS accurate_connections(
 id SERIAL PRIMARY KEY, access_token TEXT, refresh_token TEXT, token_expires_at TIMESTAMPTZ, scope TEXT,
 user_email TEXT, database_id BIGINT, database_alias TEXT, api_host TEXT, session_id TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS items_cache(
 id SERIAL PRIMARY KEY, accurate_id BIGINT UNIQUE, item_no TEXT UNIQUE NOT NULL, name TEXT NOT NULL, unit TEXT, item_type TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS warehouses_cache(
 id SERIAL PRIMARY KEY, accurate_id BIGINT UNIQUE, code TEXT, name TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS accounts_cache(
 id SERIAL PRIMARY KEY, accurate_id BIGINT UNIQUE, account_no TEXT UNIQUE, name TEXT NOT NULL, account_type TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS boms(
 id BIGSERIAL PRIMARY KEY, bom_no TEXT UNIQUE NOT NULL, name TEXT NOT NULL, product_item_no TEXT NOT NULL, product_name TEXT NOT NULL,
 output_qty NUMERIC(18,4) NOT NULL DEFAULT 1, notes TEXT, status TEXT NOT NULL DEFAULT 'ACTIVE', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS bom_materials(
 id BIGSERIAL PRIMARY KEY, bom_id BIGINT NOT NULL REFERENCES boms(id) ON DELETE CASCADE, item_no TEXT NOT NULL, item_name TEXT NOT NULL, qty NUMERIC(18,4) NOT NULL, unit TEXT
);
CREATE TABLE IF NOT EXISTS bom_costs(
 id BIGSERIAL PRIMARY KEY, bom_id BIGINT NOT NULL REFERENCES boms(id) ON DELETE CASCADE, cost_name TEXT NOT NULL, account_no TEXT, amount NUMERIC(18,2) NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS work_orders(
 id BIGSERIAL PRIMARY KEY, wo_no TEXT UNIQUE NOT NULL, bom_id BIGINT REFERENCES boms(id), product_item_no TEXT NOT NULL, product_name TEXT NOT NULL,
 planned_qty NUMERIC(18,4) NOT NULL, warehouse_name TEXT, wo_date DATE NOT NULL DEFAULT CURRENT_DATE, notes TEXT,
 status TEXT NOT NULL DEFAULT 'DRAFT', approved_at TIMESTAMPTZ, accurate_job_id TEXT, accurate_job_no TEXT, sync_error TEXT,
 created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS work_order_materials(
 id BIGSERIAL PRIMARY KEY, work_order_id BIGINT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE, item_no TEXT NOT NULL, item_name TEXT NOT NULL, qty NUMERIC(18,4) NOT NULL, unit TEXT
);
CREATE TABLE IF NOT EXISTS work_order_costs(
 id BIGSERIAL PRIMARY KEY, work_order_id BIGINT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE, cost_name TEXT NOT NULL, account_no TEXT, amount NUMERIC(18,2) NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS approval_logs(
 id BIGSERIAL PRIMARY KEY, work_order_id BIGINT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE, action TEXT NOT NULL, actor TEXT DEFAULT 'Admin', notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS sync_logs(
 id BIGSERIAL PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT, action TEXT NOT NULL, status TEXT NOT NULL, message TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE accounts_cache ADD COLUMN IF NOT EXISTS account_type TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_cache_no ON accounts_cache(account_no);
CREATE INDEX IF NOT EXISTS idx_wo_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_bom_materials_bom ON bom_materials(bom_id);
CREATE INDEX IF NOT EXISTS idx_wo_materials_wo ON work_order_materials(work_order_id);
`);
console.log('Migration selesai'); await c.end();
