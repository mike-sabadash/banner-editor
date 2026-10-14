// Read-only diagnosis using the running gateway's environment. Never prints keys.
import {execFileSync} from 'node:child_process';
const processes=JSON.parse(execFileSync('pm2',['jlist'],{encoding:'utf8'}));
const env=processes.find(p=>p.name==='banner-openrouter-gateway')?.pm2_env;
const key=env?.OPENROUTER_API_KEY||env?.env?.OPENROUTER_API_KEY;
if(!key){console.log('OPENROUTER_DIAGNOSTICS: running gateway key unavailable');process.exit(0);}
for(const endpoint of ['key','credits']){
 try{
  const response=await fetch(`https://openrouter.ai/api/v1/${endpoint}`,{headers:{authorization:`Bearer ${key}`},signal:AbortSignal.timeout(15000)});
  const payload=await response.json(),d=payload.data||{};
  const fields=endpoint==='key'?['label','limit','limit_remaining','limit_reset','usage','usage_daily','usage_weekly','usage_monthly','is_free_tier']:['total_credits','total_usage'];
  console.log('OPENROUTER_DIAGNOSTICS '+endpoint+': '+JSON.stringify({status:response.status,...Object.fromEntries(fields.filter(k=>Object.hasOwn(d,k)).map(k=>[k,d[k]]))}));
 }catch{console.log('OPENROUTER_DIAGNOSTICS '+endpoint+': read failed');}
}
