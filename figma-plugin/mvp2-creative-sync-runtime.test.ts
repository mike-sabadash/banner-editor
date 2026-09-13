import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const code=readFileSync(new URL('./mvp2-sync-code.js',import.meta.url),'utf8');

type MockNode=any;
function makeNode(id:string,type:string,name:string,x=0,y=0,width=100,height=30){
 const data:Record<string,string>={},children:MockNode[]=[];
 const node:any={id,type,name,x,y,width,height,children,parent:null,removed:false,fontName:{family:'Inter',style:'Regular'},characters:'',manualKeyframeTracks:{},animations:{},animationStyles:[],timelines:[{id:`timeline-${id}`,duration:2}],
  setSharedPluginData:(_ns:string,key:string,value:string)=>{data[key]=value},getSharedPluginData:(_ns:string,key:string)=>data[key]||'',
  appendChild(child:MockNode){children.push(child);child.parent=node},findAll(predicate:(item:MockNode)=>boolean){const found:MockNode[]=[];const visit=(item:MockNode)=>{for(const child of item.children){if(predicate(child))found.push(child);visit(child)}};visit(node);return found},
  resize(nextWidth:number,nextHeight:number){node.width=nextWidth;node.height=nextHeight},
  applyManualKeyframeTrack(field:{name:string},track:any){node.manualKeyframeTracks[field.name]=track},
  applyAnimationStyle(){},setTimelineDuration(_id:string,duration:number){node.timelines[0].duration=duration},
  async getRangeAllFontNames(){return[node.fontName]},clone(){throw new Error('clone not expected in this test')}
 };
 return node as typeof node;
}

function setMeta(node:MockNode,key:string,value:string){node.setSharedPluginData('banner_campaign',key,value)}

describe('MVP2 Figma creative sync runtime',()=>{
 it('copies headline content and relative Motion/easing to every linked resize while preserving layout',async()=>{
  const page=makeNode('page','PAGE','Page'),roots=[makeNode('r1','COMPONENT','1200×628',0,0,1200,628),makeNode('r2','COMPONENT','300×250',0,0,300,250),makeNode('r3','COMPONENT','728×90',0,0,728,90)];
  roots.forEach((root,index)=>{setMeta(root,'campaignId','campaign-1');setMeta(root,'formatId',`format-${index}`);setMeta(root,'familyId',index===2?'Strip':'Rectangle');page.appendChild(root)});
  const source=makeNode('s','TEXT','Headline',120,80,500,60),targetA=makeNode('a','TEXT','Headline',20,24,220,30),targetB=makeNode('b','TEXT','Headline',12,10,300,18);
  for(const node of [source,targetA,targetB]){setMeta(node,'semanticRole','headline.primary');setMeta(node,'slotId','headline.primary')}
  source.characters='New campaign title';targetA.characters='Old A';targetB.characters='Old B';
  source.manualKeyframeTracks.TRANSLATION_X={baseValue:{type:'FLOAT',value:0},keyframes:[{timelinePosition:0,value:{type:'FLOAT',value:0},easing:{type:'EASE_IN'}},{timelinePosition:1.4,value:{type:'FLOAT',value:80},easing:{type:'CUSTOM_CUBIC_BEZIER',easingFunctionCubicBezier:{x1:.2,y1:.8,x2:.4,y2:1}}}]};
  roots[0].appendChild(source);roots[1].appendChild(targetA);roots[2].appendChild(targetB);
  const nodes=new Map<string,MockNode>();for(const root of [page,...roots,source,targetA,targetB])nodes.set(root.id,root);
  const messages:any[]=[],figma:any={mixed:Symbol('mixed'),showUI(){},loadFontAsync:async()=>{},getNodeByIdAsync:async(id:string)=>nodes.get(id)||null,createText(){throw new Error('not expected')},createRectangle(){throw new Error('not expected')},createComponent(){throw new Error('not expected')},base64Encode(){return''},viewport:{scrollAndZoomIntoView(){}},clientStorage:{getAsync:async()=>null,setAsync:async()=>{},deleteAsync:async()=>{}},ui:{postMessage:(message:any)=>messages.push(message),onmessage:null},on(){},currentPage:page};
  page.selection=[source];page.loadAsync=async()=>{};
  const context:any={figma,__html__:'',fetch:async()=>{throw new Error('not expected')},console,JSON,Math,Date,Error,Set,Map,String,Number,Array,Object,Promise};
  runInNewContext(code,context);
  await figma.ui.onmessage({type:'pin-source',role:'headline.primary'});
  await figma.ui.onmessage({type:'creative-sync',scope:'all',parts:['content','motion','timing','easing'],createMissing:true});
  expect(targetA.characters).toBe('New campaign title');expect(targetB.characters).toBe('New campaign title');
  expect([targetA.x,targetA.y,targetA.width,targetA.height]).toEqual([20,24,220,30]);
  expect(targetA.manualKeyframeTracks.TRANSLATION_X.keyframes[1]).toMatchObject({timelinePosition:1.4,value:{value:80},easing:{type:'CUSTOM_CUBIC_BEZIER'}});
  expect(context.frameData(source,2)[1]).toMatchObject({offset:.7,easing:'cubic-bezier(0.2,0.8,0.4,1)'});
  expect(messages.find(message=>message.type==='creative-synced')?.result).toMatchObject({updated:2,created:0,tracks:2,parts:['content','motion','timing','easing']});
 });
});
