import pg from 'pg'; const {Client}=pg;
if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL belum di-set');
const c=new Client({connectionString:process.env.DATABASE_URL}); await c.connect();
await c.query('BEGIN'); try{
 const b=await c.query(`INSERT INTO boms(bom_no,name,product_item_no,product_name,output_qty,notes) VALUES('BOM-0001','Meja Office A','FG-MEJA-A','Meja Office A',1,'Demo formula') ON CONFLICT(bom_no) DO UPDATE SET name=EXCLUDED.name RETURNING id`); const id=b.rows[0].id;
 await c.query('DELETE FROM bom_materials WHERE bom_id=$1',[id]);
 await c.query('DELETE FROM bom_costs WHERE bom_id=$1',[id]);
 for(const x of [['RM-PLY-18','Plywood 18mm',2,'SHEET'],['RM-HPL-W','HPL White',3,'M2'],['RM-LEM-01','Lem',1,'KG'],['RM-SCR-01','Screw',20,'PCS']]) await c.query('INSERT INTO bom_materials(bom_id,item_no,item_name,qty,unit) VALUES($1,$2,$3,$4,$5)',[id,...x]);
 for(const x of [['Labor','5101',150000],['Cutting','5102',75000],['Finishing','5103',100000]]) await c.query('INSERT INTO bom_costs(bom_id,cost_name,account_no,amount) VALUES($1,$2,$3,$4)',[id,...x]);
 await c.query('COMMIT'); console.log('Seed demo selesai');
}catch(e){await c.query('ROLLBACK');throw e} await c.end();
