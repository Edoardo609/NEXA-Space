import { db } from "hatchable";
export const access = "member";
export default async function(req,res){
 const m=req.member;
 if(req.method==='GET'){
  const {rows}=await db.query("SELECT language,theme,avatar_url,interests FROM profiles WHERE user_id=$1",[m.id]);
  return res.json(rows[0]||{language:'it',theme:'dark',avatar_url:null,interests:[]});
 }
 if(req.method==='PUT'){
  const b=req.body||{};
  const {rows}=await db.query("INSERT INTO profiles(user_id,language,theme,avatar_url,interests) VALUES($1,$2,$3,$4,$5) ON CONFLICT(user_id) DO UPDATE SET language=EXCLUDED.language,theme=EXCLUDED.theme,avatar_url=EXCLUDED.avatar_url,interests=EXCLUDED.interests RETURNING language,theme,avatar_url,interests",[m.id,b.language||'it',b.theme||'dark',b.avatar_url||null,Array.isArray(b.interests)?b.interests:[]]);
  return res.json(rows[0]);
 }
 res.status(405).json({error:'method_not_allowed'});
}