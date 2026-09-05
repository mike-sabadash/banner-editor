export function figmaSpecFromCampaign(campaign){
 return{
  schemaVersion:1,
  campaignId:campaign.id,
  campaignName:campaign.name,
  status:campaign.status,
  mediaPlanVersion:Number(campaign.mediaPlanVersion||0),
  ttSnapshotVersion:Number(campaign.ttSnapshotVersion||0),
  creativeVersion:Number(campaign.creativeVersion||0),
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
  return{
   ...format,
   creativeState:"published",
   creativeVersion:Number(format.creativeVersion||0)+1,
   previewUrl:update.previewUrl?String(update.previewUrl):format.previewUrl,
   previewSvg:update.previewSvg?String(update.previewSvg).slice(0,2_000_000):format.previewSvg,
   previewType:update.previewType?String(update.previewType):format.previewType,
   durationSec:Number.isFinite(Number(update.durationSec))?Number(update.durationSec):format.durationSec,
   estimatedZipKb:Number.isFinite(Number(update.estimatedZipKb))?Number(update.estimatedZipKb):format.estimatedZipKb,
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
