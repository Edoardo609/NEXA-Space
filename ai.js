import { db } from 'hatchable';
export const access='public';
export const methods=['POST'];

const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const strip=s=>clean(String(s||'').replace(/<[^>]*>/g,' ').replace(/&quot;/g,'"').replace(/&#x27;/g,"'"));
const normalizeQuery=q=>{let s=clean(q);const fixes=[[/\bchie\b/gi,'chi è'],[/\bch e\b/gi,'chi è'],[/\bchi e\b/gi,'chi è'],[/\bcos e\b/gi,"cos'è"],[/\bperche\b/gi,'perché'],[/\bqual e\b/gi,"qual è"]];for(const [a,b] of fixes)s=s.replace(a,b);return s};
const safeUrl=u=>{try{let x=String(u||'').replace(/&amp;/g,'&');if(x.startsWith('//'))x='https:'+x;const z=new URL(x,'https://html.duckduckgo.com');const uddg=z.searchParams.get('uddg');if(uddg)return decodeURIComponent(uddg);return /^https?:\/\//i.test(x)?x:''}catch{return ''}};

async function webSearch(q){
 const out=[];
 // Ricerca Wikipedia: fonte strutturata e utile per persone, luoghi e concetti.
 try{
  const u='https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch='+encodeURIComponent(q)+'&format=json&srlimit=5';
  const r=await fetch(u); const d=await r.json();
  for(const x of (d?.query?.search||[]).slice(0,3)) out.push({title:x.title,snippet:strip(x.snippet),url:'https://en.wikipedia.org/wiki/'+encodeURIComponent(x.title.replace(/ /g,'_')),source:'Wikipedia'});
 }catch(e){console.error('Wikipedia search failed',e?.message)}
 // Ricerca web generale senza dipendere dal modello AI: DuckDuckGo HTML.
 try{
  const u='https://html.duckduckgo.com/html/?q='+encodeURIComponent(q);
  const r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0'}}); const html=await r.text();
  const re=/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  let m,count=0; while((m=re.exec(html))&&count<5){const title=strip(m[2]),snippet=strip(m[3]),url=safeUrl(m[1]);if(title&&snippet&&url){out.push({title,snippet,url,source:'Web'});count++}}
 }catch(e){console.error('Web search failed',e?.message)}
 return out.slice(0,8);
}

export default async function(req,res){
 const b=req.body||{}; const rawMessage=clean(b.message); const message=normalizeQuery(rawMessage); const deviceId=clean(b.device_id).slice(0,120); const displayName=clean(b.display_name).slice(0,80);
 if(!message)return res.status(400).json({error:'message_required'});
 if(message.length>12000)return res.status(400).json({error:'message_too_long'});
 const key=process.env.GROQ_API_KEY; if(!key)return res.status(503).json({error:'ai_not_configured'});

 let profile={},memories=[],liveContext='';
 if(deviceId){try{
   await db.query('CREATE TABLE IF NOT EXISTS nexa_device_memory (id BIGSERIAL PRIMARY KEY, device_id TEXT NOT NULL, memory TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now())');
   await db.query('CREATE INDEX IF NOT EXISTS nexa_device_memory_device_created_idx ON nexa_device_memory(device_id,created_at DESC)');
   const p=await db.query('SELECT * FROM nexa_device_profiles WHERE device_id=$1',[deviceId]);profile=p.rows[0]||{};
   if(profile.memory_enabled!==false){const m=await db.query('SELECT memory FROM nexa_device_memory WHERE device_id=$1 ORDER BY created_at DESC LIMIT 20',[deviceId]);memories=m.rows.map(x=>x.memory)}
 }catch(e){console.error('profile lookup',e?.message)}}
 try{const a=await db.query('SELECT kind,title,description FROM nexa_content WHERE active=true ORDER BY created_at DESC LIMIT 10');liveContext=(a.rows||[]).map(x=>`[${x.kind||'NEXA'}] ${x.title} — ${x.description||''}`).join('\n')}catch{}

 // OBBLIGATORIO: ogni domanda attiva una ricerca web lato server prima della risposta.
 const searchResults=await webSearch(message);
 const webContext=searchResults.length?searchResults.map((x,i)=>`${i+1}. ${x.title} | ${x.source}\n${x.snippet}\n${x.url}`).join('\n\n'):'Nessun risultato web restituito in questo momento.';

 let history=Array.isArray(b.history)?b.history.slice(-10).filter(x=>x&&x.role&&x.content).map(x=>({role:x.role==='assistant'?'assistant':'user',content:String(x.content).slice(0,4000)})):[];
 const userName=displayName||profile.display_name||profile.first_name||'';
 const system=`Sei NEXA AI 🚀, un assistente preciso, affidabile e moderno. Rispondi nella lingua dell'utente.
COMPRENSIONE DEL LINGUAGGIO UMANO: il messaggio può contenere piccoli refusi comuni già normalizzati prima della ricerca. Interpreta sempre il significato e l'intenzione, non solo le singole parole. Gestisci bene refusi, errori di battitura, parole attaccate, apostrofi mancanti, abbreviazioni, slang e frasi scritte velocemente. Correggi mentalmente gli errori evidenti senza farlo notare e senza chiedere inutili chiarimenti. Usa il contesto della conversazione per capire riferimenti come "lui", "quello", "prima", "come hai detto". Se una frase ha più interpretazioni possibili, scegli quella più naturale dal contesto; chiedi chiarimenti solo quando cambierebbero davvero la risposta.
RICERCA WEB OBBLIGATORIA: per OGNI domanda è stata eseguita una ricerca web lato server e i risultati sono qui sotto. Usa questi risultati come contesto prioritario per i fatti. Non dire mai "non ho accesso al web" e non chiedere all'utente se vuole che tu cerchi: la ricerca è automatica. Se i risultati sono insufficienti o contrastanti, dillo chiaramente invece di inventare.
ANTIALLOCAZIONE: non inventare persone, nazionalità, lavori, canzoni, serie TV, date, collaborazioni o statistiche. Non trasformare una persona reale in un personaggio immaginario. Per domande su persone identifica prima la persona dai risultati web e usa solo informazioni supportate dal contesto.
STILE: risposte ordinate e piacevoli. Inizia con una risposta diretta. Usa titoli brevi con emoji, punti elenco e **grassetto**. Emoji naturali e pertinenti 😊🎤🔎📌✨🚀❤️. Niente tabelle salvo richiesta esplicita. Non usare muri di testo.
SALUTO: se è la prima risposta della conversazione e NOME UTENTE è presente, saluta con quel nome visualizzato dall'account. Non inventare nomi e non ripetere il saluto in ogni messaggio.
NOME UTENTE: ${userName||'non disponibile'}
RISULTATI WEB APPENA CERCATI:\n${webContext}
ASSISTENZA NEXA: Per assistenza in tutto il mondo: email edoardodalsoggio@gmail.com. Per assistenza telefonica solo in Italia: +39 351 378 3205. Canale YouTube ufficiale: @NEXAOfficial-27. Quando l'utente chiede contatti, assistenza o come contattare NEXA, fornisci questi dati chiaramente e senza inventarne altri.\nDATI NEXA:\n${liveContext||'Nessun dato.'}\nMEMORIA UTENTE:\n${memories.slice(0,10).join('\n')||'Nessuna.'}`;
 const messages=[{role:'system',content:system},...history,{role:'user',content:message}];
 const models=['openai/gpt-oss-120b','openai/gpt-oss-20b']; let answer='',usedModel='',lastError='';
 for(const model of models){try{
   const rr=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify({model,messages,temperature:.2,max_tokens:1400})});
   let dd={};try{dd=await rr.json()}catch{}
   const content=clean(dd?.choices?.[0]?.message?.content);
   if(rr.ok&&content){answer=content;usedModel=model;break}
   lastError=`${rr.status} ${dd?.error?.message||'empty response'}`;console.error('model failed',model,lastError);
  }catch(e){lastError=e?.message||String(e);console.error('model request failed',model,lastError)}}
 if(!answer)return res.status(502).json({error:'ai_unavailable',detail:lastError||'No AI response'});
 // Memoria persistente: conserva il contesto utile per le prossime conversazioni sullo stesso dispositivo/account.
 if(deviceId && profile.memory_enabled!==false){
   try{
     const memory=clean('Utente: '+message+' | NEXA AI: '+answer).slice(0,1800);
     if(memory.length>8){
       await db.query('INSERT INTO nexa_device_memory(device_id,memory) VALUES($1,$2)',[deviceId,memory]);
       await db.query('DELETE FROM nexa_device_memory WHERE device_id=$1 AND id NOT IN (SELECT id FROM nexa_device_memory WHERE device_id=$1 ORDER BY created_at DESC LIMIT 50)',[deviceId]);
     }
   }catch(e){console.error('memory save',e?.message)}
 }
 res.json({answer,provider:'groq',model:usedModel,web_search:true,memory_enabled:deviceId?profile.memory_enabled!==false:false,citations:searchResults.map(x=>({title:x.title,url:x.url,source:x.source}))});
}