import { db } from 'hatchable';
export const access='public';
export const methods=['GET','POST'];
export default async function(req,res){const b=req.body||{};const deviceId=String(req.query?.device_id||b.device_id||'').trim().slice(0,120);if(!deviceId)return res.status(400).json({error:'device_id_required'});if(req.method==='GET')return res.json([]);res.json({ok:true});}