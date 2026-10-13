import {describe,it,expect} from 'vitest';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
import {buildResizeLabPrompt,imageAspectRatio} from './resizeLabCheckpoint.mjs';
import {resizeLabImageRequest,runResizeLabImage,approvedRolloutInput,APPROVED_CHECKPOINT_EXECUTION} from './resizeLabImage.mjs';
const fixture=JSON.parse(await readFile(new URL('./__fixtures__/resizeLabCheckpoint-65d2e842.json',import.meta.url),'utf8'));
const model='google/gemini-3.1-flash-image';
const input={imageDataUrl:'data:image/png;base64,AQID',target:{width:728,height:90},family:'strip',prompt:'Keep the warm lighting'};
describe('approved 65d2e842 rollout parity',()=>{
 it('keeps the approved prompt module byte-for-byte, rather than another rewritten approximation',async()=>{
  expect(await readFile(new URL('./resizeLabCheckpoint.mjs',import.meta.url),'utf8')).toBe(fixture.promptModule);
 });
 it.each(['micro','strip','landscape','square','portrait','skyscraper'])('matches the original provider request and raw response for %s',async family=>{
  const bytes=await sharp({create:{width:2100,height:900,channels:3,background:'#654321'}}).png().toBuffer();
  const answer={data:[{b64_json:bytes.toString('base64'),media_type:'image/png'}],usage:{cost:.069}},calls:any[]=[];
  const fetchImpl=async(url:string,options:any)=>{calls.push({url,headers:options.headers,body:JSON.parse(options.body)});return {ok:true,json:async()=>answer}};
  const runOriginal=new Function('fetch','API_KEY','IMAGE_MODEL','buildResizeLabPrompt','imageAspectRatio',fixture.handlerSource+'; return runResizeLab;')(fetchImpl,'test-key',model,buildResizeLabPrompt,imageAspectRatio);
  const reference=await runOriginal({...input,family});const oldRequest=calls[0];calls.length=0;
  const current=await runResizeLabImage(approvedRolloutInput({...input,family,savedGenerationPrompt:'must not leak',savedDirections:{opaque:'must not influence request'}}),{apiKey:'test-key',model,fetchImpl,resolveDirection:async()=>{throw Error('Checkpoint must not invoke planning/cache/review')}});
  expect(calls).toHaveLength(1);expect(calls[0]).toEqual(oldRequest);expect(current.imageDataUrl).toBe(reference.imageDataUrl);expect(current.model).toBe(reference.model);expect(current.cost).toBe(reference.cost);expect(current.costBreakdown).toEqual({generation:.069});
  expect(Buffer.from(current.imageDataUrl.split(',')[1],'base64')).toEqual(bytes);
  expect(await sharp(Buffer.from(current.imageDataUrl.split(',')[1],'base64')).metadata()).toMatchObject({width:2100,height:900});
 });
 it('forces the checkpoint for stale rollout clients while retaining local AI edit behavior',()=>{
  expect(approvedRolloutInput({...input,executionVersion:'direct-adaptation-v4'}).executionVersion).toBe(APPROVED_CHECKPOINT_EXECUTION);
  const edit={...input,editMode:true,executionVersion:'direct-adaptation-v4'};expect(approvedRolloutInput(edit)).toBe(edit);
  const request=resizeLabImageRequest(approvedRolloutInput(input),model);expect(request.aspect_ratio).toBe('21:9');expect(request.resolution).toBe('1K');expect(request.output_format).toBe('jpeg');
 });
 it('returns a provider failure with no automatic retry or additional paid calls',async()=>{
  let calls=0;const result=await runResizeLabImage(approvedRolloutInput(input),{apiKey:'test-key',model,fetchImpl:async()=>{calls++;return {ok:false,status:503}}});expect(calls).toBe(1);expect(result.error).toBeTruthy();expect(result.imageDataUrl).toBeUndefined();
 });
 it('is enforced by the production gateway',async()=>{
  const code=await readFile(new URL('./openrouterGateway.mjs',import.meta.url),'utf8');expect(code).toContain('runResizeLabImage(approvedRolloutInput(input)');
 });
});
