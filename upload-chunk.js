import { storage } from 'hatchable';
export const access='member'; export const methods=['POST'];
export default async function(req,res){
 try{
  const f=(req.files||[]).find(x=>x.field==='chunk');
  const session=String(req.body?.session||'').replace(/[^a-zA-Z0-9_-]/g,'');
  const index=Number(req.body?.index);
  if(!f||!session||!Number.isInteger(index)||index<0)return res.status(400).json({ok:false,error:'Chunk non valido'});
  if(f.buffer.length>3*1024*1024)return res.status(413).json({ok:false,error:'Chunk troppo grande'});
  const key='uploads/chunks/'+session+'/'+String(index).padStart(6,'0');
  await storage.put(key,f.buffer,f.contentType||'application/octet-stream');
  res.json({ok:true,key,index});
 }catch(e){console.error('chunk upload failed',e);res.status(500).json({ok:false,error:'chunk_upload_failed',message:String(e.message||e)})}
}