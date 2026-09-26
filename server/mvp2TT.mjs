import {listTTKnowledge} from './ttKnowledgeService.mjs';

const norm=value=>String(value||'').trim().toLowerCase().replace(/ё/g,'е');
const aliases={
 'yandex':['yandex','яндекс'],
 'yandex direct':['yandex direct','яндекс директ','директ'],
 'yandex services':['yandex services','сервисы яндекса'],
 'yandex frontpage / ya.ru':['yandex frontpage','ya.ru','главная яндекса','яндекс главная'],
 'adriver':['adriver','адривер'],
 'adfox':['adfox','адфокс'],
 'habr':['habr','хабр'],
 'hh.ru':['hh.ru','headhunter','хедхантер'],
};
function platformScore(input,item){const q=norm(input),values=[item.platform,item.publisher].flatMap(v=>aliases[norm(v)]||[norm(v)]);if(!q)return 0;if(values.some(v=>q===v))return 100;if(values.some(v=>q.includes(v)||v.includes(q)))return 75;return 0;}
function formatScore(width,height,item){const target=`${Number(width)}×${Number(height)}`;if(!width||!height)return 0;if((item.formats||[]).includes(target))return 60;if(!(item.formats||[]).length)return 15;return -40;}
function placementScore(placement,item){const q=norm(placement);if(!q)return 0;const hay=norm([item.platform,item.publisher,item.category,...(item.notes||[])].join(' '));return q.split(/\s+/).filter(x=>x.length>2).some(x=>hay.includes(x))?15:0;}

export function matchTT({platform,placement,width,height},items=listTTKnowledge().items){
 const ranked=(items||[]).filter(item=>item.status==='verified').map(item=>{const ps=platformScore(platform,item),fs=formatScore(width,height,item),pls=placementScore(placement,item);return{item,score:ps+fs+pls,signals:{platform:ps,format:fs,placement:pls}}}).filter(x=>x.signals.platform>0&&x.signals.format>=0).sort((a,b)=>b.score-a.score);
 if(!ranked.length)return{status:'not_found',matches:[],reason:'No verified source matches platform + size.'};
 const best=ranked[0],ties=ranked.filter(x=>x.score===best.score);
 if(ties.length>1)return{status:'ambiguous',matches:ties.map(toPublic),reason:'Several verified sources match. Specify placement/product.'};
 return{status:'matched',matches:[toPublic(best)],reason:'Unique verified deterministic match.'};
}
function toPublic({item,score,signals}){return{id:item.id,platform:item.platform,publisher:item.publisher,score,signals,sourceUrl:item.sourceUrl,sourceTitle:item.sourceTitle,lastCheckedAt:item.lastCheckedAt,requirements:{maxZipKb:item.maxZipKb??null,maxDurationSec:item.maxDurationSec??null,clickTag:item.clickTracking?true:null,tracking:item.tracking?true:null,sourceUrl:item.sourceUrl,sourceLabel:item.sourceTitle||item.platform,checkedAt:item.lastCheckedAt},notes:[...(item.notes||[])]};}

export function resolveCampaignTT(campaign){return{campaignId:campaign.id,results:(campaign.placements||[]).map(p=>({placementId:p.id,...matchTT(p)}))};}
