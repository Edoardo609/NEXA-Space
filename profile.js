import { db } from 'hatchable';
export const access='public';
export const methods=['GET','PUT'];
export default async function(req,res){
  const b=req.body||{};
  const deviceId=String(req.query?.device_id||b.device_id||'').trim().slice(0,120);
  if(!deviceId)return res.status(400).json({error:'device_id_required'});
  if(req.method==='GET'){
    const r=await db.query('SELECT * FROM nexa_device_profiles WHERE device_id=$1',[deviceId]);
    return res.json(r.rows[0]||{device_id:deviceId,email:'',first_name:'',last_name:'',display_name:'',avatar_url:'',language:'it',theme:'dark',memory_enabled:true});
  }
  const vals=[deviceId,String(b.email||'').trim().slice(0,320),String(b.first_name||'').slice(0,80),String(b.last_name||'').slice(0,80),String(b.display_name||'').slice(0,80),String(b.avatar_url||'').slice(0,6000000),b.language==='en'?'en':'it',b.theme==='light'?'light':'dark',b.memory_enabled!==false];
  const r=await db.query(`INSERT INTO nexa_device_profiles(device_id,email,first_name,last_name,display_name,avatar_url,language,theme,memory_enabled,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,now()) ON CONFLICT(device_id) DO UPDATE SET email=EXCLUDED.email,first_name=EXCLUDED.first_name,last_name=EXCLUDED.last_name,display_name=EXCLUDED.display_name,avatar_url=EXCLUDED.avatar_url,language=EXCLUDED.language,theme=EXCLUDED.theme,memory_enabled=EXCLUDED.memory_enabled,updated_at=now() RETURNING *`,vals);
  res.json(r.rows[0]);
}