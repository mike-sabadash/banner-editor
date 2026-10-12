import {describe,expect,it} from 'vitest';
import {mkdtemp,readFile,readdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {resolvePersistedDirection,validateAnalysis,validatePlan} from './resizeLabDirection.mjs';
import {artworkReviewIssues,artworkReviewWarnings} from './resizeLabReview.mjs';
import {compositionContract} from './resizeLabPrompt.mjs';
const rect={x:.45,y:.1,width:.5,height:.8};
const analysis=(kind='related-group')=>({kind,summary:'A vehicle and person interacting',visualLanguage:'Same photographic scene',readingFlow:'Left to right',invariants:['Preserve interaction and relative scale'],groups:[{id:'car-person',description:'Car and person',role:kind==='abstract'?'pattern':kind==='environment'?'environment':'primary',members:kind==='abstract'?['shapes','light bands']:['car','person'],sourceBox:{x:0,y:0,width:1,height:1},relationships:kind==='abstract'?'Rhythm and mass balance':'Person leaning against the car; keep their relative scale',protectedDetails:['Product identity'],allowedCrop:'Peripheral environment only'}]});
const plan=()=>({strategy:'Horizontal connected group with quiet copy area',placements:[{groupId:'car-person',targetBox:rect,minimumHeight:.6,operation:'reposition',instruction:'Move the complete related group together, preserve the interaction'}],backgroundExtension:'Continue the original environment',allowedChanges:['Reposition the existing group','Extend existing environment'],preserveRelationships:['Same scale ratio and contact between car and person']});
const input={imageDataUrl:'data:image/png;base64,AQID',target:{width:728,height:90},family:'strip',overlayLayout:{units:'normalized',zones:[{key:'headline',x:0,y:0,width:.4,height:.8}]}};
async function fixture(kind='related-group'){
 const directory=await mkdtemp(path.join(tmpdir(),'direction-'));const calls:any[]=[];
 const options={directory,scope:'user-a',apiKey:'test-secret',model:'image-v1',reviewModel:'vision-v1',fetchImpl:async(_url:string,request:any)=>{
  const body=JSON.parse(request.body);calls.push(body);const name=body.response_format.json_schema.name;
  return {ok:true,json:async()=>({usage:{cost:.003},choices:[{message:{content:JSON.stringify(name==='artwork_structure_v1'?analysis(kind):{...plan(),placements:plan().placements.map(p=>({...p,minimumHeight:['abstract','environment'].includes(kind)?0:p.minimumHeight}))})}}]})};
 }};
 return {directory,calls,options};
}
describe('persisted source structure and format plans',()=>{
 it('analyzes once and repeats the exact saved plan, prompt and pinned models across a fresh request',async()=>{
  const f=await fixture(),first=await resolvePersistedDirection(input,f.options);
  expect(first.error).toBeUndefined();expect(f.calls).toHaveLength(2);expect(first.charges).toEqual({analysis:.003,planning:.003});
  const repeat=await resolvePersistedDirection(input,{...f.options,model:'new-image-config',reviewModel:'new-review-config'});
  expect(f.calls).toHaveLength(2);expect(repeat.planId).toBe(first.planId);expect(repeat.generationPrompt).toBe(first.generationPrompt);expect(repeat.artDirection.models).toEqual({analysis:'vision-v1',generation:'image-v1',review:'vision-v1'});expect(repeat.charges).toEqual({});
  expect(repeat.generationPrompt).not.toContain('Choose ONE');expect(repeat.generationPrompt).toContain('Car and person');
 });
 it.each(['single-object','related-group','multiple-products','abstract','environment'])('persists %s structure without inventing a person requirement',async(kind)=>{
  const f=await fixture(kind),r=await resolvePersistedDirection(input,f.options);expect(r.error).toBeUndefined();expect(r.artDirection.analysis.kind).toBe(kind);expect(r.generationPrompt).toContain('groups and group-specific scale rules');
 });
 it('adds a format without analyzing source again; repeat does not plan again',async()=>{
  const f=await fixture(),first=await resolvePersistedDirection(input,f.options);const second=await resolvePersistedDirection({...input,target:{width:300,height:300}},f.options);
  expect(f.calls).toHaveLength(3);expect(Object.keys(second.artDirection.plans)).toHaveLength(2);expect(second.artDirection.plans[first.planId]).toEqual(first.artDirection.plans[first.planId]);
 });
 it('preserves all prior revisions on explicit replan, then repeats the latest revision',async()=>{
  const f=await fixture(),first=await resolvePersistedDirection(input,f.options),second=await resolvePersistedDirection({...input,replan:true},f.options),repeat=await resolvePersistedDirection(input,f.options);
  expect(f.calls).toHaveLength(3);expect(second.planId).not.toBe(first.planId);expect(Object.keys(second.artDirection.plans)).toHaveLength(2);expect(second.artDirection.plans[first.planId]).toEqual(first.artDirection.plans[first.planId]);expect(repeat.planId).toBe(second.planId);
 });
 it('creates a new context for moved HTML zones without overwriting the previous plan',async()=>{
  const f=await fixture(),a=await resolvePersistedDirection(input,f.options),b=await resolvePersistedDirection({...input,overlayLayout:{units:'normalized',zones:[{key:'headline',x:.6,y:0,width:.4,height:.8}]}},f.options);
  expect(f.calls).toHaveLength(3);expect(b.planId).not.toBe(a.planId);expect(b.artDirection.plans[a.planId]).toBeDefined();
 });
 it('isolates distinct scene masters and private user scopes',async()=>{
  const f=await fixture(),a=await resolvePersistedDirection(input,f.options),b=await resolvePersistedDirection({...input,imageDataUrl:'data:image/png;base64,BAUG'},f.options),c=await resolvePersistedDirection(input,{...f.options,scope:'user-b'});
  expect(f.calls).toHaveLength(6);expect(a.artDirection.sourceHash).not.toBe(b.artDirection.sourceHash);expect(c.charges.analysis).toBe(.003);
 });
 it('restores the signed project backup to a new cache without any AI call',async()=>{
  const f=await fixture(),first=await resolvePersistedDirection(input,f.options),newDir=await mkdtemp(path.join(tmpdir(),'direction-backup-'));
  const restored=await resolvePersistedDirection({...input,savedDirections:{[first.artDirection.sourceHash]:JSON.parse(JSON.stringify(first.artDirection))}},{...f.options,directory:newDir});
  expect(f.calls).toHaveLength(2);expect(restored.planId).toBe(first.planId);expect(restored.generationPrompt).toBe(first.generationPrompt);
 });
 it('rejects edited project metadata instead of accepting a substituted model/plan',async()=>{
  const f=await fixture(),first=await resolvePersistedDirection(input,f.options),newDir=await mkdtemp(path.join(tmpdir(),'direction-tamper-'));const record=structuredClone(first.artDirection);record.models.generation='substituted-expensive-model';
  const r=await resolvePersistedDirection({...input,savedDirections:{[record.sourceHash]:record}},{...f.options,directory:newDir});expect(r.error).toContain('Подпись');expect(f.calls).toHaveLength(2);
 });
 it('fails closed on an unknown schema version and leaves its bytes untouched',async()=>{
  const f=await fixture();await resolvePersistedDirection(input,f.options);const scope=(await readdir(f.directory))[0],file=path.join(f.directory,scope,(await readdir(path.join(f.directory,scope)))[0]);const record=JSON.parse(await readFile(file,'utf8'));record.version=99;await writeFile(file,JSON.stringify(record));const before=await readFile(file,'utf8');
  const r=await resolvePersistedDirection(input,f.options);expect(r.error).toContain('несовместима');expect(await readFile(file,'utf8')).toBe(before);expect(f.calls).toHaveLength(2);
 });
 it('serializes simultaneous requests for one master so analysis and planning are not charged twice',async()=>{
  const f=await fixture();const [a,b]=await Promise.all([resolvePersistedDirection(input,f.options),resolvePersistedDirection(input,f.options)]);expect(a.planId).toBe(b.planId);expect(f.calls).toHaveLength(2);
 });
 it('retains paid analysis when planning fails, and retries only planning',async()=>{
  const f=await fixture();let fail=true;const fetchImpl=async(url:string,r:any)=>{if(JSON.parse(r.body).response_format.json_schema.name==='artwork_format_plan_v1'&&fail)return {ok:false,status:503};return f.options.fetchImpl(url,r)};
  const a=await resolvePersistedDirection(input,{...f.options,fetchImpl});expect(a.error).toBeTruthy();expect(a.charges.analysis).toBe(.003);expect(a.artDirection.analysis).toBeDefined();fail=false;const b=await resolvePersistedDirection(input,{...f.options,fetchImpl});expect(b.error).toBeUndefined();expect(b.charges).toEqual({planning:.003});expect(f.calls).toHaveLength(2);
 });
 it('rejects missing group membership and missing planned groups',()=>{
  expect(()=>validateAnalysis({...analysis(),groups:[{...analysis().groups[0],members:[]}]})).toThrow();expect(()=>validatePlan({...plan(),placements:[]},analysis())).toThrow();expect(()=>validatePlan(plan(),analysis('abstract'))).toThrow('нет требования масштаба hero');
 });
 it('checks group identity, relationship, scale and placement instead of a single-character criterion',()=>{
  const contract=compositionContract({...input,formatPlan:plan(),artDirection:{analysis:analysis()}}),review={reviewable:true,sourceHasHero:true,newTypography:false,newLogo:false,newButton:false,duplicatedHero:false,identityChanged:false,inventedObjects:false,essentialDetailsObstructed:false,heroBox:null,planFollowed:true,groups:[{groupId:'car-person',box:rect,identityPreserved:true,relationsPreserved:true}],evidence:'Group preserved'};
  expect(contract.minimumHeroHeight).toBe(0);expect(artworkReviewIssues(review,contract)).toEqual([]);
  const shifted={...review,groups:[{...review.groups[0],box:{...rect,x:0}}]};expect(artworkReviewIssues(shifted,contract)).toEqual([]);expect(artworkReviewWarnings(shifted,contract)).not.toEqual([]);
  expect(artworkReviewIssues({...review,groups:[{...review.groups[0],relationsPreserved:false}]},contract)).not.toEqual([]);
  expect(artworkReviewIssues({...review,groups:[{...review.groups[0],box:{...rect,height:.2}}]},contract)).toContain('слишком мелкая смысловая группа car-person');
 });
});

import sharp from 'sharp';
import {runResizeLabImage} from './resizeLabImage.mjs';
describe('full planned image pipeline',()=>{
 it('uses analysis → planning → image edit → review, then only edit/review on repeat',async()=>{
  const f=await fixture(),bytes=await sharp({create:{width:800,height:100,channels:3,background:'#777'}}).png().toBuffer(),requests:any[]=[];
  const fetchImpl=async(url:string,request:any)=>{
   const body=JSON.parse(request.body);requests.push({url,body});
   if(url.endsWith('/images'))return {ok:true,json:async()=>({data:[{b64_json:bytes.toString('base64')}],usage:{cost:.04}})};
   const name=body.response_format.json_schema.name;
   if(name!=='resize_lab_artwork_review')return f.options.fetchImpl(url,request);
   return {ok:true,json:async()=>({usage:{cost:.002},choices:[{message:{content:JSON.stringify({reviewable:true,sourceHasHero:true,newTypography:false,newLogo:false,newButton:false,duplicatedHero:false,identityChanged:false,inventedObjects:false,essentialDetailsObstructed:false,heroBox:null,planFollowed:true,groups:[{groupId:'car-person',box:rect,identityPreserved:true,relationsPreserved:true}],evidence:'Same related group and plan'})}}]})};
  };
  const options={apiKey:'test-secret',model:'image-v1',reviewModel:'vision-v1',fetchImpl,planningScope:'user-a',resolveDirection:(i:any,o:any)=>resolvePersistedDirection(i,{...o,directory:f.directory})};
  const first=await runResizeLabImage(input,options);expect(first.error).toBeUndefined();expect(first.cost).toBeCloseTo(.048);expect(requests).toHaveLength(4);expect(first.planId).toBeDefined();
  const second=await runResizeLabImage(input,{...options,model:'changed-config'});expect(second.error).toBeUndefined();expect(second.cost).toBeCloseTo(.042);expect(requests).toHaveLength(6);expect(second.planId).toBe(first.planId);expect(requests[2].body.prompt).toBe(requests[4].body.prompt);expect(requests[4].body.model).toBe('image-v1');
 });
 it('returns paid analysis/plan and the saved decision when the image provider fails',async()=>{
  const f=await fixture();const result=await runResizeLabImage(input,{apiKey:'test-secret',model:'image-v1',reviewModel:'vision-v1',planningScope:'user-a',resolveDirection:(i:any,o:any)=>resolvePersistedDirection(i,{...o,directory:f.directory}),fetchImpl:async(url:string,r:any)=>url.endsWith('/images')?{ok:false,status:503}:f.options.fetchImpl(url,r)});
  expect(result.error).toBeTruthy();expect(result.imageDataUrl).toBeUndefined();expect(result.planId).toBeDefined();expect(result.artDirection).toBeDefined();expect(result.cost).toBeCloseTo(.006);expect(result.costIncomplete).toBe(true);
 });
});

describe('immutable v1 project compatibility fixture',()=>{
 it('restores a previously saved signed v1 decision byte-for-byte even when current model config changes',async()=>{
  const record=JSON.parse(await readFile(new URL('./__fixtures__/resizeLabDirection-v1.json',import.meta.url),'utf8'));
  const directory=await mkdtemp(path.join(tmpdir(),'direction-golden-'));
  const r=await resolvePersistedDirection({...input,savedDirections:{[record.sourceHash]:record}},{directory,scope:'golden-user',apiKey:'test-secret',model:'future-model',reviewModel:'future-review',fetchImpl:async()=>{throw Error('Saved v1 project must not call AI to replan')}});
  expect(r.error).toBeUndefined();expect(r.artDirection.version).toBe(1);expect(r.artDirection).toEqual(record);expect(r.generationPrompt).toBe(Object.values(record.plans)[0].generationPrompt);
 });
});

 describe('cache integrity',()=>{it('rejects modified cached analysis without returning corrupt metadata or overwriting its bytes',async()=>{const f=await fixture();await resolvePersistedDirection(input,f.options);const scope=(await readdir(f.directory))[0],file=path.join(f.directory,scope,(await readdir(path.join(f.directory,scope)))[0]);const record=JSON.parse(await readFile(file,'utf8'));record.analysis.summary='Unrequested changed scene';await writeFile(file,JSON.stringify(record));const before=await readFile(file,'utf8');const r=await resolvePersistedDirection(input,f.options);expect(r.error).toContain('Подпись');expect(r.artDirection).toBeUndefined();expect(await readFile(file,'utf8')).toBe(before);expect(f.calls).toHaveLength(2);});});
describe('versioned execution repair without replanning',()=>{
 it.each([{repairExecution:true},{executionVersion:'source-edit-v2'}])('keeps old signed execution and creates one separate repaired revision without planning: %j',async(flags)=>{
  const record=JSON.parse(await readFile(new URL('./__fixtures__/resizeLabDirection-v1.json',import.meta.url),'utf8')),oldId=Object.keys(record.plans)[0],old=structuredClone(record.plans[oldId]);const directory=await mkdtemp(path.join(tmpdir(),'repair-execution-'));let calls=0;const options={directory,scope:'repair-user',apiKey:'test-secret',model:'future-image',reviewModel:'future-review',fetchImpl:async()=>{calls++;throw Error('Repair must not invoke AI planning')}};
  const first=await resolvePersistedDirection({...input,savedDirections:{[record.sourceHash]:record},...flags},options);expect(first.error).toBeUndefined();expect(first.artDirection.plans[oldId]).toEqual(old);expect(first.planId).not.toBe(oldId);expect(first.artDirection.plans[first.planId].executionVersion).toBe('source-edit-v2');expect(first.artDirection.plans[first.planId].replaces).toBe(oldId);expect(first.plan).toEqual(old.plan);expect(first.artDirection.models).toEqual(record.models);expect(first.generationPrompt).toContain('HORIZONTAL DESIGN RE-LAYOUT');expect(first.generationPrompt).toContain('Never tile');expect(first.charges).toEqual({});
  const repeat=await resolvePersistedDirection({...input,repairExecution:true},options);expect(repeat.planId).toBe(first.planId);expect(repeat.generationPrompt).toBe(first.generationPrompt);expect(Object.keys(repeat.artDirection.plans)).toHaveLength(Object.keys(record.plans).length+1);expect(calls).toBe(0);
 });
});

it('rejects an unknown requested execution version before any paid planning',async()=>{const f=await fixture();const r=await resolvePersistedDirection({...input,executionVersion:'future-unknown'},f.options);expect(r.error).toContain('не поддерживается');expect(f.calls).toHaveLength(0)});
