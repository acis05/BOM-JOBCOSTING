import pg from 'pg';
import crypto from 'crypto';
const {Client}=pg;
if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL belum di-set');
const c=new Client({connectionString:process.env.DATABASE_URL});
await c.connect();

await c.query(`
CREATE TABLE IF NOT EXISTS organizations(
 id BIGSERIAL PRIMARY KEY,
 name TEXT NOT NULL,
 email TEXT,
 phone TEXT,
 status TEXT NOT NULL DEFAULT 'TRIAL',
 trial_ends_at TIMESTAMPTZ,
 subscription_started_at TIMESTAMPTZ,
 subscription_ends_at TIMESTAMPTZ,
 plan_code TEXT,
 max_users INTEGER NOT NULL DEFAULT 5,
 max_databases INTEGER NOT NULL DEFAULT 5,
 created_at TIMESTAMPTZ DEFAULT NOW(),
 updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS activation_requests(
 id BIGSERIAL PRIMARY KEY,
 organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 plan_code TEXT NOT NULL,
 duration_months INTEGER NOT NULL,
 price NUMERIC(18,2) NOT NULL,
 status TEXT NOT NULL DEFAULT 'PENDING',
 notes TEXT,
 requested_at TIMESTAMPTZ DEFAULT NOW(),
 processed_at TIMESTAMPTZ,
 processed_by TEXT
);
CREATE TABLE IF NOT EXISTS super_admins(
 id BIGSERIAL PRIMARY KEY,
 username TEXT UNIQUE NOT NULL,
 display_name TEXT NOT NULL,
 password_hash TEXT NOT NULL,
 active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS super_admin_sessions(
 token_hash TEXT PRIMARY KEY,
 admin_id BIGINT NOT NULL REFERENCES super_admins(id) ON DELETE CASCADE,
 expires_at TIMESTAMPTZ NOT NULL,
 created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_users(
 id BIGSERIAL PRIMARY KEY,
 organization_id BIGINT REFERENCES organizations(id),
 username TEXT UNIQUE NOT NULL,
 display_name TEXT NOT NULL,
 password_hash TEXT NOT NULL,
 active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS organization_id BIGINT REFERENCES organizations(id);

CREATE TABLE IF NOT EXISTS app_roles(
 id BIGSERIAL PRIMARY KEY,
 organization_id BIGINT REFERENCES organizations(id),
 name TEXT UNIQUE NOT NULL,
 display_name TEXT,
 created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE app_roles ADD COLUMN IF NOT EXISTS organization_id BIGINT REFERENCES organizations(id);
ALTER TABLE app_roles ADD COLUMN IF NOT EXISTS display_name TEXT;

CREATE TABLE IF NOT EXISTS app_user_roles(
 user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
 role_id BIGINT NOT NULL REFERENCES app_roles(id) ON DELETE CASCADE,
 PRIMARY KEY(user_id,role_id)
);
CREATE TABLE IF NOT EXISTS app_role_permissions(
 role_id BIGINT NOT NULL REFERENCES app_roles(id) ON DELETE CASCADE,
 permission_key TEXT NOT NULL,
 PRIMARY KEY(role_id,permission_key)
);
CREATE TABLE IF NOT EXISTS app_sessions(
 token_hash TEXT PRIMARY KEY,
 user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
 expires_at TIMESTAMPTZ NOT NULL,
 created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accurate_connections(
 id SERIAL PRIMARY KEY,
 organization_id BIGINT REFERENCES organizations(id),
 access_token TEXT,
 refresh_token TEXT,
 token_expires_at TIMESTAMPTZ,
 scope TEXT,
 user_email TEXT,
 database_id BIGINT,
 database_alias TEXT,
 api_host TEXT,
 session_id TEXT,
 is_active BOOLEAN NOT NULL DEFAULT FALSE,
 updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE accurate_connections ADD COLUMN IF NOT EXISTS organization_id BIGINT REFERENCES organizations(id);
ALTER TABLE accurate_connections ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS items_cache(
 id SERIAL PRIMARY KEY,
 organization_id BIGINT REFERENCES organizations(id),
 accurate_id BIGINT,
 item_no TEXT NOT NULL,
 name TEXT NOT NULL,
 unit TEXT,
 item_type TEXT,
 updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE items_cache ADD COLUMN IF NOT EXISTS organization_id BIGINT REFERENCES organizations(id);
-- Legacy single-tenant versions created global UNIQUE constraints.
-- They must be removed before the same Accurate IDs can exist in different organizations.
ALTER TABLE items_cache DROP CONSTRAINT IF EXISTS items_cache_item_no_key;
ALTER TABLE items_cache DROP CONSTRAINT IF EXISTS items_cache_accurate_id_key;
DROP INDEX IF EXISTS items_cache_item_no_key;
DROP INDEX IF EXISTS items_cache_accurate_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_items_cache_org_no ON items_cache(organization_id,item_no);
CREATE UNIQUE INDEX IF NOT EXISTS idx_items_cache_org_accurate_id ON items_cache(organization_id,accurate_id) WHERE accurate_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS warehouses_cache(
 id SERIAL PRIMARY KEY,
 organization_id BIGINT REFERENCES organizations(id),
 accurate_id BIGINT,
 code TEXT,
 name TEXT NOT NULL,
 updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE warehouses_cache ADD COLUMN IF NOT EXISTS organization_id BIGINT REFERENCES organizations(id);
ALTER TABLE warehouses_cache DROP CONSTRAINT IF EXISTS warehouses_cache_accurate_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_warehouses_cache_org_id ON warehouses_cache(organization_id,accurate_id);

CREATE TABLE IF NOT EXISTS accounts_cache(
 id SERIAL PRIMARY KEY,
 organization_id BIGINT REFERENCES organizations(id),
 accurate_id BIGINT,
 account_no TEXT,
 name TEXT NOT NULL,
 account_type TEXT,
 updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE accounts_cache ADD COLUMN IF NOT EXISTS organization_id BIGINT REFERENCES organizations(id);
ALTER TABLE accounts_cache ADD COLUMN IF NOT EXISTS account_type TEXT;
DROP INDEX IF EXISTS idx_accounts_cache_no;
ALTER TABLE accounts_cache DROP CONSTRAINT IF EXISTS accounts_cache_accurate_id_key;
ALTER TABLE accounts_cache DROP CONSTRAINT IF EXISTS accounts_cache_account_no_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_cache_org_no ON accounts_cache(organization_id,account_no);

CREATE TABLE IF NOT EXISTS branches_cache(
 id SERIAL PRIMARY KEY,
 organization_id BIGINT REFERENCES organizations(id),
 accurate_id BIGINT,
 name TEXT NOT NULL,
 updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE branches_cache ADD COLUMN IF NOT EXISTS organization_id BIGINT REFERENCES organizations(id);
ALTER TABLE branches_cache DROP CONSTRAINT IF EXISTS branches_cache_accurate_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_branches_cache_org_id ON branches_cache(organization_id,accurate_id);

CREATE TABLE IF NOT EXISTS boms(
 id BIGSERIAL PRIMARY KEY,
 organization_id BIGINT REFERENCES organizations(id),
 bom_no TEXT UNIQUE NOT NULL,
 name TEXT NOT NULL,
 product_item_no TEXT NOT NULL,
 product_name TEXT NOT NULL,
 output_qty NUMERIC(18,4) NOT NULL DEFAULT 1,
 notes TEXT,
 status TEXT NOT NULL DEFAULT 'ACTIVE',
 created_at TIMESTAMPTZ DEFAULT NOW(),
 updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE boms ADD COLUMN IF NOT EXISTS organization_id BIGINT REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_boms_org ON boms(organization_id);

CREATE TABLE IF NOT EXISTS bom_materials(
 id BIGSERIAL PRIMARY KEY,
 bom_id BIGINT NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
 item_no TEXT NOT NULL,
 item_name TEXT NOT NULL,
 qty NUMERIC(18,4) NOT NULL,
 unit TEXT
);
CREATE TABLE IF NOT EXISTS bom_costs(
 id BIGSERIAL PRIMARY KEY,
 bom_id BIGINT NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
 cost_name TEXT NOT NULL,
 account_no TEXT,
 amount NUMERIC(18,2) NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS work_orders(
 id BIGSERIAL PRIMARY KEY,
 organization_id BIGINT REFERENCES organizations(id),
 wo_no TEXT UNIQUE NOT NULL,
 bom_id BIGINT REFERENCES boms(id),
 product_item_no TEXT NOT NULL,
 product_name TEXT NOT NULL,
 planned_qty NUMERIC(18,4) NOT NULL,
 warehouse_name TEXT,
 wo_date DATE NOT NULL DEFAULT CURRENT_DATE,
 notes TEXT,
 status TEXT NOT NULL DEFAULT 'DRAFT',
 branch_id BIGINT,
 branch_name TEXT,
 approved_at TIMESTAMPTZ,
 accurate_job_id TEXT,
 accurate_job_no TEXT,
 accurate_rollover_id TEXT,
 accurate_rollover_no TEXT,
 sync_error TEXT,
 rollover_error TEXT,
 created_at TIMESTAMPTZ DEFAULT NOW(),
 updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS organization_id BIGINT REFERENCES organizations(id);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS branch_id BIGINT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS branch_name TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS accurate_rollover_id TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS accurate_rollover_no TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS rollover_error TEXT;
CREATE INDEX IF NOT EXISTS idx_wo_org ON work_orders(organization_id);

CREATE TABLE IF NOT EXISTS work_order_materials(
 id BIGSERIAL PRIMARY KEY,
 work_order_id BIGINT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
 item_no TEXT NOT NULL,
 item_name TEXT NOT NULL,
 qty NUMERIC(18,4) NOT NULL,
 unit TEXT
);
CREATE TABLE IF NOT EXISTS work_order_costs(
 id BIGSERIAL PRIMARY KEY,
 work_order_id BIGINT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
 cost_name TEXT NOT NULL,
 account_no TEXT,
 amount NUMERIC(18,2) NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS approval_logs(
 id BIGSERIAL PRIMARY KEY,
 work_order_id BIGINT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
 action TEXT NOT NULL,
 actor TEXT DEFAULT 'Admin',
 notes TEXT,
 created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS sync_logs(
 id BIGSERIAL PRIMARY KEY,
 organization_id BIGINT REFERENCES organizations(id),
 entity_type TEXT NOT NULL,
 entity_id TEXT,
 action TEXT NOT NULL,
 status TEXT NOT NULL,
 message TEXT,
 created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS organization_id BIGINT REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_wo_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_bom_materials_bom ON bom_materials(bom_id);
CREATE INDEX IF NOT EXISTS idx_wo_materials_wo ON work_order_materials(work_order_id);
`);

const hashPassword=(password)=>{const salt=crypto.randomBytes(16).toString('hex');const hash=crypto.scryptSync(password,salt,64).toString('hex');return `${salt}:${hash}`};
const perms=['dashboard.view','bom.view','bom.create','bom.edit','bom.delete','bom.import','bom.print','wo.view','wo.create','wo.edit','wo.delete','wo.import','wo.print','approval.view','approval.approve','accurate.view','accurate.connect','accurate.sync','accurate.push_job','accurate.rollover','access.manage'];

// Legacy/default organization for existing installation.
let legacy=(await c.query(`SELECT id FROM organizations ORDER BY id LIMIT 1`)).rows[0];
if(!legacy){legacy=(await c.query(`INSERT INTO organizations(name,email,status,trial_ends_at,plan_code,subscription_started_at,subscription_ends_at) VALUES('Internal / Existing Account',NULL,'ACTIVE',NULL,'YEARLY',NOW(),NOW()+INTERVAL '10 years') RETURNING id`)).rows[0];}
const legacyOrg=Number(legacy.id);
for(const t of ['app_users','app_roles','accurate_connections','items_cache','warehouses_cache','accounts_cache','branches_cache','boms','work_orders','sync_logs']){
  await c.query(`UPDATE ${t} SET organization_id=$1 WHERE organization_id IS NULL`,[legacyOrg]).catch(()=>{});
}

let role=(await c.query(`SELECT id FROM app_roles WHERE name='Administrator' LIMIT 1`)).rows[0];
if(!role) role=(await c.query(`INSERT INTO app_roles(organization_id,name,display_name) VALUES($1,'Administrator','Administrator') RETURNING id`,[legacyOrg])).rows[0];
await c.query(`UPDATE app_roles SET organization_id=COALESCE(organization_id,$1),display_name=COALESCE(display_name,'Administrator') WHERE id=$2`,[legacyOrg,role.id]);
for(const key of perms) await c.query(`INSERT INTO app_role_permissions(role_id,permission_key) VALUES($1,$2) ON CONFLICT DO NOTHING`,[role.id,key]);
const userCount=Number((await c.query('SELECT COUNT(*) c FROM app_users')).rows[0].c||0);
if(userCount===0){
 const username=process.env.APP_ADMIN_USERNAME||'admin'; const password=process.env.APP_ADMIN_PASSWORD||'admin123';
 const u=(await c.query(`INSERT INTO app_users(organization_id,username,display_name,password_hash) VALUES($1,$2,'Administrator',$3) RETURNING id`,[legacyOrg,username,hashPassword(password)])).rows[0];
 await c.query(`INSERT INTO app_user_roles(user_id,role_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,[u.id,role.id]);
 console.log(`[AUTH] Admin awal dibuat: ${username}.`);
}

const saCount=Number((await c.query('SELECT COUNT(*) c FROM super_admins')).rows[0].c||0);
if(saCount===0){
 const username=process.env.SUPER_ADMIN_USERNAME||'superadmin';
 const password=process.env.SUPER_ADMIN_PASSWORD||'ChangeMe123!';
 await c.query(`INSERT INTO super_admins(username,display_name,password_hash) VALUES($1,'Super Admin',$2)`,[username,hashPassword(password)]);
 console.log(`[SUPERADMIN] Akun awal dibuat: ${username}. Ganti password melalui Railway variable SUPER_ADMIN_PASSWORD sebelum database pertama kali dibuat.`);
}
console.log('Migration selesai');
await c.end();
