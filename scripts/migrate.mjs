import pg from 'pg'; import crypto from 'crypto'; const {Client}=pg;
if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL belum di-set');
const c=new Client({connectionString:process.env.DATABASE_URL});
await c.connect();
await c.query(`

CREATE TABLE IF NOT EXISTS app_users(
 id BIGSERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, display_name TEXT NOT NULL, password_hash TEXT NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS app_roles(
 id BIGSERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS app_user_roles(
 user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, role_id BIGINT NOT NULL REFERENCES app_roles(id) ON DELETE CASCADE, PRIMARY KEY(user_id,role_id)
);
CREATE TABLE IF NOT EXISTS app_role_permissions(
 role_id BIGINT NOT NULL REFERENCES app_roles(id) ON DELETE CASCADE, permission_key TEXT NOT NULL, PRIMARY KEY(role_id,permission_key)
);
CREATE TABLE IF NOT EXISTS app_sessions(
 token_hash TEXT PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
);

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
CREATE TABLE IF NOT EXISTS branches_cache(
 id SERIAL PRIMARY KEY, accurate_id BIGINT UNIQUE, name TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW()
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
 status TEXT NOT NULL DEFAULT 'DRAFT', branch_id BIGINT, branch_name TEXT, approved_at TIMESTAMPTZ, accurate_job_id TEXT, accurate_job_no TEXT, sync_error TEXT,
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
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS branch_id BIGINT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS branch_name TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS accurate_rollover_id TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS accurate_rollover_no TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS rollover_error TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_cache_no ON accounts_cache(account_no);
CREATE INDEX IF NOT EXISTS idx_wo_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_bom_materials_bom ON bom_materials(bom_id);
CREATE INDEX IF NOT EXISTS idx_wo_materials_wo ON work_order_materials(work_order_id);
`);

const perms=['dashboard.view','bom.view','bom.create','bom.edit','bom.delete','bom.import','bom.print','wo.view','wo.create','wo.edit','wo.delete','wo.import','wo.print','approval.view','approval.approve','accurate.view','accurate.connect','accurate.sync','accurate.push_job','accurate.rollover','access.manage'];
let role=(await c.query(`INSERT INTO app_roles(name) VALUES('Administrator') ON CONFLICT(name) DO UPDATE SET name=EXCLUDED.name RETURNING id`)).rows[0];
for(const key of perms) await c.query(`INSERT INTO app_role_permissions(role_id,permission_key) VALUES($1,$2) ON CONFLICT DO NOTHING`,[role.id,key]);
const userCount=Number((await c.query('SELECT COUNT(*) c FROM app_users')).rows[0].c||0);
if(userCount===0){
 const username=process.env.APP_ADMIN_USERNAME||'admin'; const password=process.env.APP_ADMIN_PASSWORD||'admin123';
 const salt=crypto.randomBytes(16).toString('hex'); const hash=crypto.scryptSync(password,salt,64).toString('hex');
 const u=(await c.query(`INSERT INTO app_users(username,display_name,password_hash) VALUES($1,'Administrator',$2) RETURNING id`,[username,`${salt}:${hash}`])).rows[0];
 await c.query(`INSERT INTO app_user_roles(user_id,role_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,[u.id,role.id]);
 console.log(`[AUTH] Admin awal dibuat: ${username}. Segera ganti password dari menu Hak Akses.`);
}
console.log('Migration selesai'); await c.end();
