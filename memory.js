import { db } from 'hatchable';
export const access='public';
export const methods=['GET','POST','DELETE'];
export default async function(req,res){
  const b=req.body||{};
  const deviceId=String(req.query?.device_id||b.device_id||'').trim().slice(0,120);
  if(!deviceId)return res.status(400).json({error:'device_id_required'});
  if(req.method==='GET'){
    const r=await db.query('SELECT id,memory,created_at FROM nexa_device_memory WHERE device_id=$1 ORDER BY created_at DESC',[deviceId]);
    return res.json(r.rows);
  }
  if(req.method==='POST'){
    const memory=String(b.memory||'').trim().slice(0,2000);
    if(!memory)return res.status(400).json({error:'memory_required'});
    const r=await db.query('INSERT INTO nexa_device_memory(device_id,memory) SELECT $1,$2 WHERE NOT EXISTS (SELECT 1 FROM nexa_device_memory WHERE device_id=$1 AND memory=$2) RETURNING id,memory,created_at',[deviceId,memory]);
    return res.json({ok:true,memory:r.rows[0]||null});
  }
  await db.query('DELETE FROM nexa_device_memory WHERE device_id=$1 AND id=$2',[deviceId,b.id]);
  res.json({ok:true});
}