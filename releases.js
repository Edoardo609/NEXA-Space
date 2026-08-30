import { db } from 'hatchable';
export const access='public';
export const methods=['GET'];
export default async function(req,res){const r=await db.query('SELECT id,title,description,type,image_url,release_at FROM content WHERE published=true AND release_at IS NOT NULL AND release_at>now() ORDER BY release_at ASC');res.json(r.rows)}