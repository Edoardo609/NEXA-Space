import { db } from 'hatchable';
export const access='public';
export const methods=['GET','POST','DELETE'];
export default async function(req,res){
 if(req.method==='GET'){const email=String(req.query?.email||'').trim().toLowerCase();if(!email)return res.status(400).json({error:'email_required'});const r=await db.query('SELECT email,email_enabled,push_enabled,news,apps,music,videos,projects,events,releases FROM notification_preferences WHERE email=$1',[email]);return res.json({preferences:r.rows[0]||null})}
 const b=req.body||{},email=String(b.email||'').trim().toLowerCase();if(!email)return res.status(400).json({error:'email_required'});
 if(req.method==='POST'){const r=await db.query('INSERT INTO notification_preferences(email,email_enabled,push_enabled,news,apps,music,videos,projects,events,releases,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now()) ON CONFLICT(email) DO UPDATE SET email_enabled=EXCLUDED.email_enabled,push_enabled=EXCLUDED.push_enabled,news=EXCLUDED.news,apps=EXCLUDED.apps,music=EXCLUDED.music,videos=EXCLUDED.videos,projects=EXCLUDED.projects,events=EXCLUDED.events,releases=EXCLUDED.releases,updated_at=now() RETURNING *',[email,b.email_enabled!==false,b.push_enabled===true,b.news!==false,b.apps!==false,b.music!==false,b.videos!==false,b.projects!==false,b.events!==false,b.releases!==false]);return res.json({preferences:r.rows[0]})}
 await db.query('DELETE FROM notification_preferences WHERE email=$1',[email]);res.json({ok:true})
}