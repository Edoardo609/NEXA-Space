import { db } from 'hatchable';
export const access='public';
export const methods=['GET'];
export default async function(req,res){const r=await db.query('SELECT id,title,description,image_url,starts_at,ends_at,linked_content_id FROM campaigns WHERE published=true AND starts_at<=now() AND ends_at>now() ORDER BY starts_at DESC');res.json(r.rows)}