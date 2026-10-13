import sharp from 'sharp';
import {resolvePersistedDirection} from './resizeLabDirection.mjs';
import {reviewResizeLabArtwork} from './resizeLabReview.mjs';
import {buildResizeLabPrompt,imageAspectRatio,generationViewport} from './resizeLabPrompt.mjs';
import {buildResizeLabPrompt as checkpointPrompt,imageAspectRatio as checkpointAspect} from './resizeLabCheckpoint.mjs';

export const APPROVED_CHECKPOINT_EXECUTION='checkpoint-65d2e842';
// Public rollout always uses the approved checkpoint, including stale clients.
// Local AI edits retain their existing explicitly requested edit-only path.
export const approvedRolloutInput=input=>input.editMode?input:{...input,executionVersion:APPROVED_CHECKPOINT_EXECUTION};

export function resizeTarget(value={width:728,height:90}){
 const width=Number(value.width),height=Number(value.height);
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>8192||height>8192||width*height>32_000_000)throw Error('Invalid banner dimensions');
 return {width,height};
}
export function resizeLabImageRequest(input,model){
 const target=resizeTarget(input.target),family=String(input.family||'landscape'),userPrompt=String(input.prompt||'').slice(0,4000);
 if(!input.editMode&&input.executionVersion===APPROVED_CHECKPOINT_EXECUTION)return {model,prompt:checkpointPrompt({target,userPrompt,family,composition:input.composition}),aspect_ratio:checkpointAspect(family),resolution:'1K',output_format:'jpeg',input_references:[{type:'image_url',image_url:{url:input.imageDataUrl}}]};
 const prompt=input.editMode?`Edit the supplied existing banner artwork at ${target.width}×${target.height}. Apply ONLY this user instruction: ${userPrompt}. Preserve the existing subject identity, lighting, scene and campaign style unless explicitly requested. Extend the scene naturally when moving the subject; avoid visible crop boundaries or seams. Keep the same aspect ratio. Do not render logos, buttons or any typography; HTML layers are handled separately.`:input.savedGenerationPrompt||buildResizeLabPrompt({target,userPrompt,family,composition:input.composition,overlayLayout:input.overlayLayout,artDirection:input.artDirection,formatPlan:input.formatPlan,executionVersion:input.executionVersion});
 return {model,prompt,aspect_ratio:imageAspectRatio(family,target),resolution:'1K',output_format:'jpeg',input_references:[{type:'image_url',image_url:{url:input.imageDataUrl}}]};
}
export async function prepareResizeLabImage(bytes,{target,family}){
 const dimensions=resizeTarget(target),meta=await sharp(bytes,{limitInputPixels:40_000_000}).metadata();
 if(!meta.width||!meta.height)throw Error('AI returned an unreadable image');
 const requested=imageAspectRatio(family,dimensions),[w,h]=requested.split(':').map(Number),ratio=w/h;
 // Allow provider pixel-rounding, but never accept e.g. 21:9 in place of 8:1.
 // No automatic extra generation: preserve the previous result and expose the error.
 if(Math.min(Math.abs(Math.log((meta.width/meta.height)/ratio)),Math.abs(Math.log((meta.width/meta.height)/(dimensions.width/dimensions.height))))>Math.log(1.12))throw Error(`AI вернул ${meta.width}×${meta.height} вместо пропорции ${requested}. Результат не применён: важные объекты могли бы обрезаться. Повторите раскатку или загрузите изображение нужного формата.`);
 // Keep native AI density for @2x previews, family masters and later AI edits.
 // Use integer multiples of the reduced target ratio; CSS/export dimensions stay
 // at target size while the artwork retains as many original pixels as possible.
 const gcd=(a,b)=>b?gcd(b,a%b):a;
 const divisor=gcd(dimensions.width,dimensions.height),unitWidth=dimensions.width/divisor,unitHeight=dimensions.height/divisor;
 const multiple=Math.max(divisor,Math.floor(Math.min(meta.width/unitWidth,meta.height/unitHeight)));
 const artwork={width:unitWidth*multiple,height:unitHeight*multiple};
 const image=await sharp(bytes).rotate().resize(artwork.width,artwork.height,{fit:'cover',position:'centre',kernel:'lanczos3'}).jpeg({quality:92}).toBuffer();
 return {imageDataUrl:'data:image/jpeg;base64,'+image.toString('base64'),geometry:{requestedAspect:requested,generated:{width:meta.width,height:meta.height},target:dimensions,artwork,viewport:generationViewport(dimensions,family,meta.width/meta.height)}};
}
export async function runResizeLabImage(input,{apiKey,model,reviewModel='google/gemini-2.5-flash',fetchImpl=fetch,planningScope,resolveDirection=resolvePersistedDirection}){
 if(!apiKey)throw Error('OPENROUTER_API_KEY is not configured on the server');
 if(!/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(String(input.imageDataUrl||'')))throw Error('Upload a PNG, JPEG or WebP visual');
 const checkpoint=!input.editMode&&input.executionVersion===APPROVED_CHECKPOINT_EXECUTION;
 let direction={charges:{}};
 if(!input.editMode&&!checkpoint){
  direction=await resolveDirection({...input,target:resizeTarget(input.target)},{apiKey,model,reviewModel,fetchImpl,scope:planningScope});
  if(direction.error)return {error:direction.error,artDirection:direction.artDirection,cost:Object.values(direction.charges).some(Number.isFinite)?Object.values(direction.charges).filter(Number.isFinite).reduce((sum,v)=>sum+v,0):null,costBreakdown:direction.charges,costIncomplete:Object.values(direction.charges).some(v=>!Number.isFinite(v))};
  if(direction.artDirection){input={...input,artDirection:direction.artDirection,formatPlan:direction.plan,executionVersion:direction.executionVersion,savedGenerationPrompt:direction.generationPrompt};model=direction.artDirection.models.generation;reviewModel=direction.artDirection.models.review;}
 }
 const saved={artDirection:direction.artDirection,planId:direction.planId};
 const priorCharges=Object.values(direction.charges);
 const billing=(generation,review)=>{const charges=[...priorCharges,generation,...(review===undefined?[]:[review])];return {cost:charges.some(Number.isFinite)?charges.filter(Number.isFinite).reduce((sum,value)=>sum+value,0):null,costBreakdown:{...direction.charges,generation,...(review===undefined?{}:{review})},costIncomplete:charges.some(value=>!Number.isFinite(value))};};
 const request=resizeLabImageRequest(input,model);
 let response;try{response=await fetchImpl('https://openrouter.ai/api/v1/images',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','HTTP-Referer':'https://studio.bannermatic.online','X-Title':'Bannermatic Resize Lab'},body:JSON.stringify(request)});}catch{return {error:"Image API недоступен. Результат не применён.",model,...saved,...billing(null)};}
 if(!response.ok)return {error:`Image API недоступен (HTTP ${response.status}). Результат не применён.`,model,...saved,...billing(null)};
 let data;try{data=await response.json();}catch{return {error:"Image API вернул некорректный ответ. Результат не применён.",model,...saved,...billing(null)};}const first=data?.data?.[0],cost=data?.usage?.cost??null;
 if(!first?.b64_json)return {error:'Image API returned no image',model,...saved,...billing(cost)};
 // Byte-for-byte provider artwork, exactly as the approved handler returned it.
 // No planning, review call, aspect rejection, Sharp crop or recompression.
 if(checkpoint)return {imageDataUrl:`data:${first.media_type||'image/jpeg'};base64,${first.b64_json}`,model,cost,costBreakdown:{generation:cost},executionVersion:APPROVED_CHECKPOINT_EXECUTION};
 try{
  const rawBytes=Buffer.from(first.b64_json,'base64');const rawMeta=await sharp(rawBytes,{limitInputPixels:40_000_000}).metadata();const rawType=rawMeta.format==='png'?'png':rawMeta.format==='webp'?'webp':'jpeg';
  const rawCandidate={image:'data:image/'+rawType+';base64,'+rawBytes.toString('base64'),canApply:false};
  let artwork;try{artwork=await prepareResizeLabImage(Buffer.from(first.b64_json,'base64'),{target:input.target,family:input.family||'landscape'});}catch(error){return {error:String(error instanceof Error?error.message:error),candidate:rawCandidate,model,...saved,...billing(cost)};}
  const candidate={image:artwork.imageDataUrl,canApply:true};
  const review=await reviewResizeLabArtwork({...input,target:resizeTarget(input.target)},artwork,{apiKey,model:reviewModel,fetchImpl});
  const charges=billing(cost,review.cost);
  if(review.error)return {error:review.error,candidate,model,...saved,...charges};
  if(!review.quality.accepted)return {error:'Результат не применён: '+review.quality.issues.join('; ')+'. Текущая картинка сохранена; новый вариант доступен для просмотра без повторной генерации.',candidate,quality:review.quality,model,...saved,...charges};
  return {...artwork,quality:review.quality,model,...saved,...charges};
 }
 catch(error){return {error:error instanceof Error?error.message:String(error),model,...saved,...billing(cost)};}
}
