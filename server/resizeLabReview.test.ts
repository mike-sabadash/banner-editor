import {describe,expect,it} from 'vitest';
import sharp from 'sharp';
import {compositionContract} from './resizeLabPrompt.mjs';
import {artworkReviewIssues} from './resizeLabReview.mjs';
import {runResizeLabImage} from './resizeLabImage.mjs';
const input={imageDataUrl:'data:image/png;base64,AAAA',target:{width:728,height:90},family:'strip',overlayLayout:{units:'normalized',zones:[{key:'headline',x:0,y:0,width:.4,height:.8},{key:'cta',x:.88,y:.4,width:.12,height:.6}]}};
const accepted={reviewable:true,sourceTiled:false,sourceHasHero:true,newTypography:false,newLogo:false,newButton:false,duplicatedHero:false,identityChanged:false,inventedObjects:false,essentialDetailsObstructed:false,heroBox:{x:.5,y:.1,width:.2,height:.8},evidence:'Same hero, large close-up, no new branding.'};
async function run(review:any,options:{editMode?:boolean;reviewHttpError?:boolean;reviewCost?:number|null;executionVersion?:string}={}){
 const bytes=await sharp({create:{width:800,height:100,channels:3,background:'#654321'}}).png().toBuffer();
 const requests:any[]=[];
 const result=await runResizeLabImage({...input,editMode:options.editMode,executionVersion:options.executionVersion},{resolveDirection:async()=>({charges:{}}),apiKey:'test',model:'image-test',reviewModel:'vision-test',fetchImpl:async(url:string,request:any)=>{
  requests.push({url,body:JSON.parse(request.body)});
  if(url.endsWith('/images'))return {ok:true,json:async()=>({data:[{b64_json:bytes.toString('base64')}],usage:{cost:.045}})};
  if(options.reviewHttpError)return {ok:false,status:503};
  return {ok:true,json:async()=>({choices:[{message:{content:typeof review==='string'?review:JSON.stringify(review)}}],usage:{cost:options.reviewCost===undefined ? .002 : options.reviewCost}})};
 }});
 return {result,requests};
}
describe('artwork acceptance contract',()=>{
 it('direct review needs no planned group IDs and still rejects duplicated or miniature source subjects',async()=>{
  const ok=await run(accepted,{executionVersion:'direct-adaptation-v4'});expect(ok.result.error).toBeUndefined();
  const schema=ok.requests[1].body.response_format.json_schema;
  expect(schema.name).toBe('resize_lab_direct_artwork_review');expect(schema.schema.properties.groups).toBeUndefined();expect(schema.schema.required).toContain('duplicatedHero');expect(ok.requests).toHaveLength(2);
  const duplicate=await run({...accepted,duplicatedHero:true},{executionVersion:'direct-adaptation-v4'});expect(duplicate.result.error).toContain('продублирован');expect(duplicate.result.candidate.canApply).toBe(true);expect(duplicate.result.imageDataUrl).toBeUndefined();expect(duplicate.requests).toHaveLength(2);
  const small=await run({...accepted,heroBox:{x:.5,y:.3,width:.1,height:.2}},{executionVersion:'direct-adaptation-v4'});expect(small.result.error).toContain('слишком мелкий');
  const abstract=await run({...accepted,sourceHasHero:false,heroBox:null},{executionVersion:'direct-adaptation-v4'});expect(abstract.result.error).toBeUndefined();
 });
 it('rejects source tiling even when identity and all other checks pass',()=>{
  expect(artworkReviewIssues({...accepted,sourceTiled:true},compositionContract(input))).toContain('исходник повторён плиткой или коллажем вместо адаптации');
 });
 it('places a large focal region between actual copy and CTA rather than shrinking the entire poster',()=>{
  const c=compositionContract(input);expect(c.preferredHeroRegion).toEqual({x:.4,y:0,width:.48,height:1});expect(c.minimumHeroHeight).toBe(.65);
  expect(c.occupiedZones).toHaveLength(2);expect(c.cropPriority.at(-1)).toContain('never face');
 });
 it('moves guidance to the left when copy occupies the right',()=>{
  const c=compositionContract({...input,overlayLayout:{units:'normalized',zones:[{key:'headline',x:.5,y:0,width:.5,height:1}]}});expect(c.preferredHeroRegion.x).toBe(0);expect(c.preferredHeroRegion.width).toBe(.5);
 });
 it('accepts faithful close-ups and keeps authentic source markings',async()=>{
  const {result,requests}=await run(accepted);expect(result.error).toBeUndefined();expect(result.imageDataUrl).toMatch(/^data:image\/jpeg/);expect(result.quality.accepted).toBe(true);expect(result.cost).toBeCloseTo(.047);expect(result.costBreakdown).toEqual({generation:.045,review:.002});
  expect(requests).toHaveLength(2);expect(requests[1].body.model).toBe('vision-test');expect(requests[1].body.response_format.json_schema.strict).toBe(true);
  const content=requests[1].body.messages[1].content;expect(content[1].image_url.url).toBe(input.imageDataUrl);expect(content[2].image_url.url).toBe(result.imageDataUrl);expect(content[0].text).toContain('coin engravings');
 });
 it.each(['newTypography','newLogo','newButton','duplicatedHero','identityChanged','inventedObjects','essentialDetailsObstructed'])('rejects %s without returning a replacement or automatically generating again',async(flag)=>{
  const {result,requests}=await run({...accepted,[flag]:true});expect(result.imageDataUrl).toBeUndefined();expect(result.quality.accepted).toBe(false);expect(result.candidate.canApply).toBe(true);expect(result.candidate.image).toMatch(/^data:image\/jpeg/);expect(result.error).toContain('Результат не применён');expect(result.cost).toBeCloseTo(.047);expect(requests.filter(r=>r.url.endsWith('/images'))).toHaveLength(1);
 });
 it('rejects a miniature hero even when reviewer reports no new branding',async()=>{
  const {result}=await run({...accepted,heroBox:{x:.5,y:.3,width:.1,height:.2}});expect(result.error).toContain('слишком мелкий');expect(result.imageDataUrl).toBeUndefined();
 });
 it('does not impose a hero on an abstract source or change scale during a local edit',()=>{
  expect(artworkReviewIssues({...accepted,sourceTiled:false,sourceHasHero:false,heroBox:null},compositionContract(input))).toEqual([]);
  expect(artworkReviewIssues({...accepted,heroBox:{x:.5,y:.3,width:.1,height:.2}},compositionContract({...input,editMode:true}))).toEqual([]);
 });
 it('fails closed on review outage while keeping the known generation charge',async()=>{
  const {result,requests}=await run(accepted,{reviewHttpError:true});expect(result.error).toContain('проверка не завершена');expect(result.cost).toBe(.045);expect(result.costIncomplete).toBe(true);expect(result.candidate.canApply).toBe(true);expect(result.imageDataUrl).toBeUndefined();expect(requests).toHaveLength(2);
 });
 it.each(['not JSON',{}, {...accepted,heroBox:{x:.9,y:0,width:.5,height:.8}}, {...accepted,reviewable:false}])('rejects invalid or uncertain review %j',async(review)=>{
  const {result}=await run(review);expect(result.error).toBeTruthy();expect(result.imageDataUrl).toBeUndefined();expect(result.cost).toBeCloseTo(.047);
 });
 it('does not silently bypass acceptance for local AI edits',async()=>{
  const {result,requests}=await run({...accepted,newLogo:true},{editMode:true});expect(result.imageDataUrl).toBeUndefined();expect(requests[1].body.messages[1].content[0].text).toContain('local edit');
 });
});
