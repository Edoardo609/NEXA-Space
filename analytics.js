import { db } from 'hatchable';
export const access='public';
export const methods=['POST'];
export default async function(req,res){const b=req.body||{};await db.query('INSERT INTO analytics_events(member_id,event_type,page) VALUES(NULL,$1,$2)',[String(b.event_type||'page_view').slice(0,80),String(b.page||'/').slice(0,300)]);res.json({ok:true})}