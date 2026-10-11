import {describe,expect,it} from 'vitest';
import sharp from 'sharp';
import {resizeLabImageRequest,prepareResizeLabImage,runResizeLabImage,resizeTarget} from './resizeLabImage.mjs';
const image=async(width:number,height:number)=>sharp({create:{width,height,channels:3,background:'#654321'}}).png().toBuffer();
describe('Resize Lab image pipeline',()=>{
 it('uses the same layout-aware request for both scene sources',()=>{
  const base={target:{width:728,height:90},family:'strip',composition:'composition-1',overlayLayout:{units:'normalized',zones:[{key:'headline',x:.02,y:.1,width:.39,height:.55}]}};
  const first=resizeLabImageRequest({...base,imageDataUrl:'first'},'test-model');
  const second=resizeLabImageRequest({...base,imageDataUrl:'second'},'test-model');
  expect(first.prompt).toBe(second.prompt);expect(first.aspect_ratio).toBe('8:1');expect(second.input_references[0].image_url.url).toBe('second');
  expect(first.prompt).toContain('headline: x=2.0%');expect(first.prompt).toContain('WHOLE focal group');
 });
 it('outputs the exact banner aspect without extra browser cropping or loss of native density',async()=>{
  const output=await prepareResizeLabImage(await image(800,100),{target:{width:728,height:90},family:'strip'});
  const meta=await sharp(Buffer.from(output.imageDataUrl.split(',')[1],'base64')).metadata();expect(meta).toMatchObject({width:728,height:90});expect(meta.width!/meta.height!).toBeCloseTo(728/90,10);
  expect(output.geometry.requestedAspect).toBe('8:1');
 });
 it('retains high-density artwork while keeping HTML banner dimensions unchanged',async()=>{
  const output=await prepareResizeLabImage(await image(3072,384),{target:{width:728,height:90},family:'strip'});
  const meta=await sharp(Buffer.from(output.imageDataUrl.split(',')[1],'base64')).metadata();
  expect(meta.width).toBe(2912);expect(meta.height).toBe(360);expect(meta.width!/meta.height!).toBeCloseTo(728/90,10);
  expect(output.geometry.target).toEqual({width:728,height:90});expect(output.geometry.artwork).toEqual({width:2912,height:360});
 });
 it('also accepts an output already at the exact target ratio',async()=>{
  const output=await prepareResizeLabImage(await image(640,100),{target:{width:320,height:50},family:'micro'});
  expect(output.geometry.viewport).toEqual({x:0,y:0,width:1,height:1});
 });
 it('rejects a clamped portrait-ish output for a wide strip',async()=>{
  await expect(prepareResizeLabImage(await image(700,300),{target:{width:728,height:90},family:'strip'})).rejects.toThrow('вместо пропорции 8:1');
 });
 it('keeps provider cost on rejection, with one call and no unapproved automatic retry',async()=>{
  let calls=0;const bytes=await image(700,300);
  const result=await runResizeLabImage({imageDataUrl:'data:image/png;base64,AAAA',target:{width:728,height:90},family:'strip'},{apiKey:'test',model:'test',fetchImpl:async()=>{calls++;return {ok:true,json:async()=>({data:[{b64_json:bytes.toString('base64')}],usage:{cost:.045}})}}});
  expect(calls).toBe(1);expect(result.cost).toBe(.045);expect(result.imageDataUrl).toBeUndefined();expect(result.error).toContain('Результат не применён');
 });
 it('preserves the existing edit-only instruction without triggering wholesale recomposition',()=>{
  const result=resizeLabImageRequest({imageDataUrl:'source',editMode:true,prompt:'Remove one sparkle',target:{width:300,height:300},family:'square'},'test');
  expect(result.prompt).toContain('Apply ONLY this user instruction: Remove one sparkle');expect(result.prompt).not.toContain('Recompose the WHOLE');
 });
 it('validates dimensions before an image request',()=>{
  for(const target of [{width:0,height:90},{width:728,height:NaN},{width:100000,height:9000}])expect(()=>resizeTarget(target)).toThrow('Invalid banner dimensions');
 });
});
