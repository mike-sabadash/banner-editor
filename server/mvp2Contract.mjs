const htmlDocument=value=>{const raw=String(value||"").trim();if(!raw)return"";return raw.slice(0,4_000_000);};
const text=value=>String(value??"").slice(0,20_000);
const campaignContentFingerprint=campaign=>JSON.stringify(campaign.contentVariants||[]);
function publicationRender(value={}){
 const previewHtml=htmlDocument(value.previewHtml),previewSvg=value.previewSvg?String(value.previewSvg).slice(0,2_000_000):"";
 return{previewHtml,previewSvg,previewType:previewHtml?"html":previewSvg?"figma-svg":String(value.previewType||"figma"),durationSec:Number.isFinite(Number(value.durationSec))?Number(value.durationSec):null,estimatedZipKb:Number.isFinite(Number(value.estimatedZipKb))?Number(value.estimatedZipKb):null,clickTagPresent:typeof value.clickTagPresent==="boolean"?value.clickTagPresent:null,presentElements:Array.isArray(value.presentElements)?value.presentElements.map(text).slice(0,100):[],safeZonePassed:typeof value.safeZonePassed==="boolean"?value.safeZonePassed:null,productionIssues:Array.isArray(value.productionIssues)?value.productionIssues.slice(0,100).map(issue=>({rule:text(issue?.rule||"figma"),role:text(issue?.role||""),detail:text(issue?.detail||"")})):[]};
}

export function figmaSpecFromCampaign(campaign){
 return{
  schemaVersion:1,
  campaignId:campaign.id,
  campaignName:campaign.name,
  status:campaign.status,
  mediaPlanVersion:Number(campaign.mediaPlanVersion||0),
  ttSnapshotVersion:Number(campaign.ttSnapshotVersion||0),
  creativeVersion:Number(campaign.creativeVersion||0),
  contentVariants:(campaign.contentVariants||[]).map(variant=>({id:text(variant.id),name:text(variant.name),language:text(variant.language),headline:text(variant.headline),copy:text(variant.copy),cta:text(variant.cta),legal:text(variant.legal)})),
  formats:(campaign.formats||[]).map(format=>({
   formatId:format.id,
   width:Number(format.width),
   height:Number(format.height),
   size:format.size||`${format.width}×${format.height}`,
   placementIds:[...(format.placementIds||[])],
   creativeState:format.creativeState||"missing",
   creativeVersion:Number(format.creativeVersion||0),
  })),
 };
}

export function applyCreativePublish(campaign,input={}){
 const updates=new Map((Array.isArray(input.formats)?input.formats:[]).map(item=>[String(item.formatId||item.id||""),item]));
 const touched=[];
 const formats=(campaign.formats||[]).map(format=>{
  const update=updates.get(String(format.id));
  if(!update)return format;
  touched.push(format.id);
  const knownVariants=new Set((campaign.contentVariants||[]).map(variant=>String(variant.id))),variantRenders={};
  for(const [id,value] of Object.entries(update.variantRenders||{}))if(knownVariants.has(String(id)))variantRenders[id]=publicationRender(value);
  const firstVariant=Object.values(variantRenders)[0],previewHtml=htmlDocument(update.previewHtml)||firstVariant?.previewHtml||format.previewHtml;
  const previewSvg=update.previewSvg?String(update.previewSvg).slice(0,2_000_000):firstVariant?.previewSvg||format.previewSvg;
  const previewUrl=update.previewUrl?String(update.previewUrl):format.previewUrl;
  const previewType=previewHtml?"html":update.previewType?String(update.previewType):previewSvg?"figma-svg":format.previewType;
  return{
   ...format,
   sourceType:"figma",
   creativeState:"published",
   creativeVersion:Number(format.creativeVersion||0)+1,
   previewUrl,
   previewHtml,
   previewSvg,
   previewType,
   durationSec:Number.isFinite(Number(update.durationSec))?Number(update.durationSec):format.durationSec,
   estimatedZipKb:Number.isFinite(Number(update.estimatedZipKb))?Number(update.estimatedZipKb):format.estimatedZipKb,
   clickTagPresent:typeof update.clickTagPresent==="boolean"?update.clickTagPresent:format.clickTagPresent,
   variantRenders:Object.keys(variantRenders).length?variantRenders:format.variantRenders,
   contentFingerprint:campaignContentFingerprint(campaign),
   publishedAt:new Date().toISOString(),
  };
 });
 if(!touched.length){const error=new Error("No matching campaign formats to publish");error.status=400;throw error;}
 return{
  patch:{
   formats,
   creativeVersion:Number(campaign.creativeVersion||0)+1,
   status:"compliance",
  },
  touched,
 };
}
