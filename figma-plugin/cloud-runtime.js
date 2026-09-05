const CLOUD_API="https://ads.rechord.online";

function cloudHeaders(token){
 const headers={"content-type":"application/json"};
 if(token)headers.authorization=`Bearer ${String(token).trim()}`;
 return headers;
}
function endpoint(campaignId,action){return `${CLOUD_API}/api/campaigns/${encodeURIComponent(campaignId)}/${action}`}
function formatsFromSpec(spec){return(Array.isArray(spec?.formats)?spec.formats:[]).map(f=>({id:String(f.formatId||f.id||`format-${f.width}x${f.height}`),width:Number(f.width)||0,height:Number(f.height)||0,family:f.family||"",placements:Array.isArray(f.placementIds)?f.placementIds.map(id=>({id})):[],conflicts:[]})).filter(f=>f.width&&f.height)}
async function cloudRequest(url,token,options={}){const response=await fetch(url,{...options,headers:{...cloudHeaders(token),...(options.headers||{})}});let body={};try{body=await response.json()}catch{}if(!response.ok)throw Error(body.error||`Cloud request failed (${response.status})`);return body}
async function loadCloudSpec(campaignId,token){if(!campaignId)throw Error("Campaign ID is required");if(!token)throw Error("Cloud session token is required");return cloudRequest(endpoint(campaignId,"figma-spec"),token)}
async function publishCloudCreative(campaignId,token,formats){if(!campaignId)throw Error("Campaign ID is required");if(!token)throw Error("Cloud session token is required");const payload={formats:(formats||[]).map(f=>({formatId:String(f.formatId||f.id||""),previewUrl:f.previewUrl||"",previewType:f.previewType||"figma",durationSec:Number.isFinite(Number(f.durationSec))?Number(f.durationSec):undefined,estimatedZipKb:Number.isFinite(Number(f.estimatedZipKb))?Number(f.estimatedZipKb):undefined})).filter(f=>f.formatId)};return cloudRequest(endpoint(campaignId,"creative-publish"),token,{method:"POST",body:JSON.stringify(payload)})}

if(typeof module!=="undefined")module.exports={CLOUD_API,cloudHeaders,endpoint,formatsFromSpec,loadCloudSpec,publishCloudCreative};
