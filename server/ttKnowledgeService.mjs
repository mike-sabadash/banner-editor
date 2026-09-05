import {ttKnowledgeBase,TT_KB_VERSION} from './ttKnowledgeBase.mjs';

const runtime=new Map(ttKnowledgeBase.map(x=>[x.id,structuredClone(x)]));

export function listTTKnowledge(){return{version:TT_KB_VERSION,items:[...runtime.values()]};}

const refreshSchema={name:'tt_kb_refresh',strict:true,schema:{type:'object',additionalProperties:false,properties:{formats:{type:'array',items:{type:'string'}},fileTypes:{type:'array',items:{type:'string'}},html5:{type:['boolean','null']},maxZipKb:{type:['number','null']},maxIndexKb:{type:['number','null']},maxDurationSec:{type:['number','null']},maxFiles:{type:['number','null']},clickTracking:{type:'string'},tracking:{type:'string'},notes:{type:'array',items:{type:'string'}},evidence:{type:'array',items:{type:'string'}}},required:['formats','fileTypes','html5','maxZipKb','maxIndexKb','maxDurationSec','maxFiles','clickTracking','tracking','notes','evidence']}};

function stripHtml(html){return String(html).replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim().slice(0,140000)}

export async function refreshTTKnowledge(id,{askOpenRouter,model}){
  const current=runtime.get(id);if(!current)throw new Error('Unknown TT knowledge source');
  if(current.sourceType!=='official')throw new Error('Refresh is allowed only for tracked official sources');
  const response=await fetch(current.sourceUrl,{headers:{'user-agent':'BannerEditor-TT-Knowledge/1.0'}});if(!response.ok)throw new Error(`Source fetch ${response.status}`);
  const text=stripHtml(await response.text());if(text.length<200)throw new Error('Source returned too little readable content');
  const parsed=await askOpenRouter({title:'Banner Campaign TT Knowledge Refresh',schema:refreshSchema,messages:[{role:'system',content:'You maintain a production advertising technical-requirements knowledge base. Extract only requirements explicitly supported by the supplied official source. Do not guess. Keep unknown numeric values null. Preserve placement-specific caveats.'},{role:'user',content:`Platform: ${current.platform}\nOfficial source: ${current.sourceUrl}\n\n${text}`} ]});
  const next={...current,...parsed,lastCheckedAt:new Date().toISOString().slice(0,10),status:'verified',refreshModel:model,refreshEvidence:parsed.evidence||[]};delete next.evidence;runtime.set(id,next);return next;
}

export function kbItemsAsDocuments(ids=[]){return ids.map(id=>runtime.get(id)).filter(Boolean).map(item=>({name:`KB · ${item.platform}`,text:JSON.stringify(item)}));}
