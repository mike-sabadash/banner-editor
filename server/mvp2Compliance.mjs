const nonEmpty=value=>value!==undefined&&value!==null&&String(value).trim()!=='';

function check(name,status,actual,expected,detail=''){
 return{name,status,actual:actual??null,expected:expected??null,detail};
}

export function placementCompliance(campaign,placement){
 const format=(campaign.formats||[]).find(f=>(f.placementIds||[]).includes(placement.id));
 const requirements=placement.requirements||{};
 const checks=[];
 if(!format){checks.push(check('creative','blocked',null,'published creative','No visual format is linked to this placement.'));return summarize(placement,format,checks)}
 checks.push(check('dimensions',Number(format.width)===Number(placement.width)&&Number(format.height)===Number(placement.height)?'ready':'blocked',`${format.width}×${format.height}`,`${placement.width}×${placement.height}`));
 checks.push(check('creative',format.creativeState==='published'?'ready':'blocked',format.creativeState||'missing','published'));
 if(nonEmpty(requirements.maxZipKb)){
  checks.push(nonEmpty(format.estimatedZipKb)?check('zip',Number(format.estimatedZipKb)<=Number(requirements.maxZipKb)?'ready':'blocked',Number(format.estimatedZipKb),Number(requirements.maxZipKb),'KB'):check('zip','unknown',null,Number(requirements.maxZipKb),'Published creative has no ZIP estimate yet.'));
 }
 if(nonEmpty(requirements.maxDurationSec)){
  checks.push(nonEmpty(format.durationSec)?check('duration',Number(format.durationSec)<=Number(requirements.maxDurationSec)?'ready':'blocked',Number(format.durationSec),Number(requirements.maxDurationSec),'sec'):check('duration','unknown',null,Number(requirements.maxDurationSec),'Published creative has no duration metadata yet.'));
 }
 if(requirements.clickTag===true){
  checks.push(check('clickTag',format.clickTagPresent===true?'ready':format.clickTagPresent===false?'blocked':'unknown',format.clickTagPresent??null,true,format.clickTagPresent===undefined?'Creative publish did not report clickTag presence.':''));
 }
 if(requirements.tracking===true){
  const configured=nonEmpty(requirements.impressionUrl);
  checks.push(check('tracking',configured?'ready':'blocked',configured?'configured':'missing','impression URL'));
 }
 const sourceKnown=nonEmpty(requirements.sourceUrl)||nonEmpty(requirements.sourceLabel)&&!String(requirements.sourceLabel).toLowerCase().startsWith('unknown');
 checks.push(check('tt-source',sourceKnown?'ready':'unknown',requirements.sourceLabel||requirements.sourceUrl||null,'verified or client TT source'));
 return summarize(placement,format,checks);
}

function summarize(placement,format,checks){
 const blocked=checks.filter(c=>c.status==='blocked').length,unknown=checks.filter(c=>c.status==='unknown').length;
 return{placementId:placement.id,platform:placement.platform,placement:placement.placement,size:`${placement.width}×${placement.height}`,formatId:format?.id||null,status:blocked?'blocked':unknown?'warning':'ready',checks,blocked,unknown};
}

export function campaignCompliance(campaign){
 const placements=(campaign.placements||[]).map(p=>placementCompliance(campaign,p));
 const summary={ready:placements.filter(p=>p.status==='ready').length,warning:placements.filter(p=>p.status==='warning').length,blocked:placements.filter(p=>p.status==='blocked').length,total:placements.length};
 return{campaignId:campaign.id,creativeVersion:Number(campaign.creativeVersion||0),mediaPlanVersion:Number(campaign.mediaPlanVersion||0),ttSnapshotVersion:Number(campaign.ttSnapshotVersion||0),summary,placements};
}
