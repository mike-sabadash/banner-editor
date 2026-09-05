export const DEFAULT_CLOUD_API="https://ads.rechord.online";

export function cloudHeaders(token){
 const headers={"content-type":"application/json"};
 if(token)headers.authorization=`Bearer ${String(token).trim()}`;
 return headers;
}

export function figmaSpecUrl(campaignId,base=DEFAULT_CLOUD_API){
 return `${String(base).replace(/\/$/,"")}/api/campaigns/${encodeURIComponent(campaignId)}/figma-spec`;
}

export function creativePublishUrl(campaignId,base=DEFAULT_CLOUD_API){
 return `${String(base).replace(/\/$/,"")}/api/campaigns/${encodeURIComponent(campaignId)}/creative-publish`;
}

export function formatsFromCloudSpec(spec){
 return (Array.isArray(spec?.formats)?spec.formats:[]).map(format=>({
  id:String(format.formatId||format.id||`format-${format.width}x${format.height}`),
  width:Number(format.width)||0,
  height:Number(format.height)||0,
  family:format.family||"",
  placements:Array.isArray(format.placementIds)?format.placementIds.map(id=>({id})):[],
  conflicts:[],
 })).filter(format=>format.width>0&&format.height>0);
}

export function missingCloudFormats(spec,existingRoots){
 const existing=new Set((existingRoots||[]).map(root=>`${Math.round(Number(root.width)||0)}x${Math.round(Number(root.height)||0)}`));
 return formatsFromCloudSpec(spec).filter(format=>!existing.has(`${format.width}x${format.height}`));
}

export function creativePublishPayload(formats){
 return{formats:(formats||[]).map(format=>({
  formatId:String(format.formatId||format.id||""),
  previewUrl:format.previewUrl||"",
  previewType:format.previewType||"html",
  durationSec:Number.isFinite(Number(format.durationSec))?Number(format.durationSec):undefined,
  estimatedZipKb:Number.isFinite(Number(format.estimatedZipKb))?Number(format.estimatedZipKb):undefined,
 })).filter(format=>format.formatId)};
}
