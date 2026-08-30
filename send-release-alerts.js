import { db, email } from 'hatchable';
export const access='scheduler';
export const schedule='0 * * * *';
const T='"app_14ce2009b987445c".nexa_content';
export default async function(req,res){
 try{
  await db.query("UPDATE "+T+" SET active=true,published_at=COALESCE(published_at,now()) WHERE active=false AND release_at IS NOT NULL AND release_at<=now() AND kind IN ('release','app','video','music')");
  await db.query("INSERT INTO nexa_release_alerts(user_id,content_id,email) SELECT p.device_id,c.id,p.email FROM nexa_device_profiles p JOIN notification_preferences n ON lower(n.email)=lower(p.email) CROSS JOIN nexa_content c WHERE p.email<>'' AND n.email_enabled=true AND ((c.kind='release' AND n.releases=true) OR (c.kind='app' AND n.apps=true) OR (c.kind='video' AND n.videos=true) OR (c.kind='music' AND n.music=true)) AND c.active=true AND c.release_at IS NOT NULL AND c.release_at<=now() ON CONFLICT(user_id,content_id) DO NOTHING");
  await db.query("INSERT INTO nexa_release_alerts(user_id,content_id,email) SELECT 'owner-email',c.id,s.notification_email FROM owner_settings s CROSS JOIN nexa_content c WHERE s.notification_email<>'' AND c.active=true AND c.release_at IS NOT NULL AND c.release_at<=now() AND c.kind IN ('release','app','video','music') ON CONFLICT(user_id,content_id) DO NOTHING");
  const r=await db.query("SELECT a.id AS alert_id,a.email,c.kind,c.title,c.description FROM nexa_release_alerts a JOIN nexa_content c ON c.id=a.content_id WHERE a.notified_at IS NULL AND a.email<>'' AND c.active=true ORDER BY a.created_at ASC LIMIT 25");
  let sent=0,failed=0;for(const x of r.rows){try{const label={app:'app',video:'video',music:'contenuto musicale',release:'release'}[x.kind]||'contenuto';await email.send({to:x.email,subject:`NEXA — ${x.title} è disponibile`,text:`Il ${label} ${x.title} è ora disponibile su NEXA Space Site.`,html:`<p>Il ${label} <strong>${x.title}</strong> è ora disponibile su NEXA Space Site.</p><p>${x.description||''}</p>`});await db.query('UPDATE nexa_release_alerts SET notified_at=now() WHERE id=$1',[x.alert_id]);sent++}catch(e){failed++;console.error('release alert failed',e)}}
  res.json({ok:true,sent,failed,queued:r.rows.length});
 }catch(e){console.error('release scheduler failed',e);res.status(500).json({error:'release_alerts_failed',message:String(e.message||e)})}
}