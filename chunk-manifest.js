import { storage } from 'hatchable';
export const access='public'; export const methods=['GET'];
export default async function(req,res){
 try{
  const key=String(req.query?.key||'');
  if(!key.startsWith('uploads/manifests/'))return res.status(400).json({error:'Invalid manifest'});
  const x=await storage.get(key);
  const text=new TextDecoder().decode(x.buffer);
  const m=JSON.parse(text);
  if(!Array.isArray(m.chunks)||!m.chunks.every(k=>String(k).startsWith('uploads/chunks/')))throw Error('Invalid manifest');
  res.json({ok:true,name:m.name,type:m.type,total:m.total,chunks:m.chunks.map(k=>'/api/file?key='+encodeURIComponent(k))});
 }catch(e){res.status(404).json({error:'Manifest unavailable',message:String(e.message||e)})}
}