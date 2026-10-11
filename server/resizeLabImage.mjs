import sharp from 'sharp';
import {reviewResizeLabArtwork} from './resizeLabReview.mjs';
import {buildResizeLabPrompt,imageAspectRatio,generationViewport} from './resizeLabPrompt.mjs';

export function resizeTarget(value={width:728,height:90}){
 const width=Number(value.width),height=Number(value.height);
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>8192||height>8192||width*height>32_000_000)throw Error('Invalid banner dimensions');
 return {width,height};
}
export function resizeLabImageRequest(input,model){
 const target=resizeTarget(input.target),family=String(input.family||'landscape'),userPrompt=String(input.prompt||'').slice(0,4000);
 const prompt=input.editMode?`Edit the supplied existing banner artwork at ${target.width}×${target.height}. Apply ONLY this user instruction: ${userPrompt}. Preserve the existing subject identity, lighting, scene and campaign style unless explicitly requested. Extend the scene naturally when moving the subject; avoid visible crop boundaries or seams. Keep the same aspect ratio. Do not render logos, buttons or any typography; HTML layers are handled separately.`:buildResizeLabPrompt({target,userPrompt,family,composition:input.composition,overlayLayout:input.overlayLayout});
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
export async function runResizeLabImage(input,{apiKey,model,reviewModel='google/gemini-2.5-flash',fetchImpl=fetch}){
 if(!apiKey)throw Error('OPENROUTER_API_KEY is not configured on the server');
 if(!/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(String(input.imageDataUrl||'')))throw Error('Upload a PNG, JPEG or WebP visual');
 const request=resizeLabImageRequest(input,model);
 const response=await fetchImpl('https://openrouter.ai/api/v1/images',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','HTTP-Referer':'https://studio.bannermatic.online','X-Title':'Bannermatic Resize Lab'},body:JSON.stringify(request)});
 if(!response.ok)throw Error(`OpenRouter Image API ${response.status}: ${(await response.text()).slice(0,900)}`);
 const data=await response.json(),first=data?.data?.[0],cost=data?.usage?.cost??null;
 if(!first?.b64_json)return {error:'Image API returned no image',model,cost};
 try{
  const artwork=await prepareResizeLabImage(Buffer.from(first.b64_json,'base64'),{target:input.target,family:input.family||'landscape'});
  const review=await reviewResizeLabArtwork({...input,target:resizeTarget(input.target)},artwork,{apiKey,model:reviewModel,fetchImpl});
  const charges=[cost,review.cost],total=charges.filter(Number.isFinite).reduce((sum,value)=>sum+value,0);
  const billing={cost:charges.some(Number.isFinite)?total:null,costBreakdown:{generation:cost,review:review.cost},costIncomplete:charges.some(value=>!Number.isFinite(value))};
  if(review.error)return {error:review.error,model,...billing};
  if(!review.quality.accepted)return {error:'Результат не применён: '+review.quality.issues.join('; ')+'. Предыдущая картинка сохранена. Можно повторить раскатку вручную.',quality:review.quality,model,...billing};
  return {...artwork,quality:review.quality,model,...billing};
 }
 catch(error){return {error:error instanceof Error?error.message:String(error),model,cost};}
}
