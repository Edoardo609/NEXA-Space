import { db } from 'hatchable';
export const access='public';
export const methods=['GET'];
export default async function(req,res){const q=String(req.query?.q||'').trim();if(!q)return res.json([]);const s=q.replace(/'/g,"''").replace(/[%_]/g,'');const like='%'+s+'%';const sql="SELECT id,kind AS type,title,description,image_url,created_at FROM nexa_content WHERE active=true AND (title ILIKE '"+like+"' OR description ILIKE '"+like+"') ORDER BY created_at DESC LIMIT 30";const r=await db.query(sql);res.json(r.rows||[])}