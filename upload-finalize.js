import { storage } from 'hatchable';
export const access='member'; export const methods=['POST'];
export default async function(req,res){
 try{
  const session=String(req.body?.session||'').replace(/[^a-zA-Z0-9_-]/g,'');
  const total=Number(req.body?.total),name=String(req.body?.name||'file'),type=String(req.body?.type||'application/octet-stream');
  if(!session||!Number.isInteger(total)||total<1||total>2000)return res.status(400).json({ok:false,error:'Manifest non valido'});
  const chunks=Array.from({length:total},(_,i)=>'uploads/chunks/'+session+'/'+String(i).padStart(6,'0'));
  const manifest={version:1,name,type,total,chunks,created_at:new Date().toISOString()};
  const key='uploads/manifests/'+Date.now()+'-'+session+'.json';
  await storage.put(key,new TextEncoder().encode(JSON.stringify(manifest)),'application/json');
  res.json({ok:true,key,url:'chunked:'+key});
 }catch(e){console.error('finalize failed',e);res.status(500).json({ok:false,error:'finalize_failed',message:String(e.message||e)})}
}