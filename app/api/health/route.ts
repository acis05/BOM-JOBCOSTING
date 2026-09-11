export const dynamic='force-dynamic';
export async function GET(){
  return Response.json({status:'ok',app:'BOM-JOBCOSTING AOL',version:'0.2.2',databaseConfigured:Boolean(process.env.DATABASE_URL)});
}
