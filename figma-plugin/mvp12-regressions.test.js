import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('./mvp12-sync-code.js',import.meta.url),'utf8');

function runtime(code){
 let seq=0;const nodes=new Map();
 const figma={mixed:Symbol('mixed'),showUI(){},ui:{},loadFontAsync:async()=>{},getNodeByIdAsync:async id=>nodes.get(id),currentPage:{},clientStorage:{}};
 function node(type='FRAME',name='Layer',props={}){
  const data={},n={id:'n'+(++seq),type,name,x:0,y:0,width:100,height:30,visible:true,opacity:1,children:[],parent:null,removed:false,fontSize:20,lineHeight:{unit:'PIXELS',value:30},fontName:{family:'Inter',style:'Regular'},characters:'Hello world',textAlignHorizontal:'LEFT',manualKeyframeTracks:{},animationStyles:[],
   setSharedPluginData(ns,k,v){data[k]=v},getSharedPluginData(ns,k){return data[k]||''},
   resize(w,h){this.width=w;this.height=this.type==='TEXT'?this.fontSize*1.5:h},
   appendChild(child){if(child.parent){const i=child.parent.children.indexOf(child);if(i>=0)child.parent.children.splice(i,1)}this.children.push(child);child.parent=this},
   findAll(predicate){return this.children.flatMap(ch=>[...(predicate(ch)?[ch]:[]),...ch.findAll(predicate)])},
   remove(){this.removed=true;if(this.parent){const i=this.parent.children.indexOf(this);if(i>=0)this.parent.children.splice(i,1)}},
   applyManualKeyframeTrack(field,track){this.manualKeyframeTracks[field.name]=track},
   clone(){const result=node(this.type,this.name,{x:this.x,y:this.y,width:this.width,height:this.height,fontSize:this.fontSize,lineHeight:JSON.parse(JSON.stringify(this.lineHeight)),characters:this.characters});for(const [k,v]of Object.entries(data))result.setSharedPluginData('banner_campaign',k,v);for(const child of this.children)result.appendChild(child.clone());return result},
   ...props
  };nodes.set(n.id,n);return n;
 }
 const api=new Function('figma','__html__',code+';return {layerForSource,cleanupLegacyDuplicates,prepareMasterSlots,cloneInto,syncNestedSlots,syncExisting,syncFinalMotion,syncFinalMotionTree,commitWorkingChildren,fitTextBox,textRhythm,applyTextRhythm,updateResizes};')(figma,'');
 const meta=(n,k,v)=>n.setSharedPluginData('banner_campaign',k,v);
 return{api,node,meta,figma};
}

it('keeps role lookup inside its parent and never steals a linked sibling',()=>{
 const {api,node,meta}=runtime(code),root=node(),group=node(),nested=node('TEXT','Headline'),source=node('TEXT','Headline');
 meta(nested,'semanticRole','headline.primary');root.appendChild(group);group.appendChild(nested);
 expect(api.layerForSource(root,source,'headline.primary')).toBe(null);
 const sibling=node('TEXT','Headline');meta(sibling,'semanticRole','headline.primary');meta(sibling,'masterSourceId','another-source');root.appendChild(sibling);
 expect(api.layerForSource(root,source,'headline.primary')).toBe(null);
});
it('does not delete multiple author-created headlines during legacy cleanup',()=>{
 const {api,node,meta}=runtime(code),root=node(),a=node('TEXT','Headline'),b=node('TEXT','Headline');
 for(const n of [a,b]){meta(n,'semanticRole','headline.primary');meta(n,'managedBy','bannermatic');root.appendChild(n)}
 api.cleanupLegacyDuplicates(root);expect(root.children.length).toBe(2);expect(a.removed||b.removed).toBe(false);
});
it('marks all cloned descendants so repeat sync creates no duplicates',async()=>{
 const {api,node,meta}=runtime(code),master=node(),targetRoot=node(),source=node(),nested=node(),text=node('TEXT','Headline');
 nested.appendChild(text);source.appendChild(nested);master.appendChild(source);api.prepareMasterSlots(master);
 const target=await api.cloneInto(source,master,targetRoot,'custom.group.1');
 const result=await api.syncNestedSlots(source,target);
 expect(result.created).toBe(0);expect(target.children.length).toBe(1);expect(target.children[0].children.length).toBe(1);
 expect(target.children[0].children[0].getSharedPluginData('banner_campaign','masterSourceId')).toBe(text.id);
});
it('preserves pixel line-height proportion through layout fitting',async()=>{
 const {api,node}=runtime(code),text=node('TEXT');
 await api.fitTextBox(text,{x:0,y:0,width:100,fontSize:10,minFont:8,maxHeight:40,lineHeight:1.03});
 expect(text.fontSize).toBe(10);expect(text.lineHeight.value).toBe(15);
});
it('preserves AUTO and percentage leading while changing text size',async()=>{
 const {api,node}=runtime(code);
 for(const lineHeight of [{unit:'AUTO'},{unit:'PERCENT',value:140}]){
  const text=node('TEXT','Headline',{lineHeight});
  await api.fitTextBox(text,{x:0,y:0,width:100,fontSize:10,minFont:8,maxHeight:40});
  expect(text.lineHeight).toEqual(lineHeight);
 }
});
it('copies font family and reflows text inside the target width',async()=>{
 const {api,node}=runtime(code),source=node('TEXT','Headline',{fontName:{family:'Roboto',style:'Bold'},fontSize:40,lineHeight:{unit:'PIXELS',value:60}}),target=node('TEXT','Headline',{width:70,fontSize:16});
 await api.syncExisting(source,target,node(),node());
 expect(target.fontName).toEqual(source.fontName);expect(target.width).toBe(70);expect(target.lineHeight.value).toBe(24);expect(target.textAutoResize).toBe('HEIGHT');
});
it('binds nested WIDTH motion to final geometry rather than the pre-layout width',async()=>{
 const {api,node,meta}=runtime(code),master=node(),root=node(),source=node(),target=node(),nestedSource=node(),nestedTarget=node();
 master.appendChild(source);root.appendChild(target);source.appendChild(nestedSource);target.appendChild(nestedTarget);
 meta(target,'masterSourceId',source.id);meta(nestedTarget,'masterSourceId',nestedSource.id);
 nestedSource.manualKeyframeTracks.WIDTH={baseValue:{type:'FLOAT',value:100},keyframes:[{timelinePosition:1.2,easing:{type:'EASE_OUT'},value:{type:'FLOAT',value:130}}]};
 await api.syncExisting(nestedSource,nestedTarget,source,target);
 expect(Object.keys(nestedTarget.manualKeyframeTracks).length).toBe(0);
 nestedTarget.resize(240,30);await api.syncFinalMotion(master,root);
 expect(nestedTarget.manualKeyframeTracks.WIDTH.baseValue.value).toBe(240);
 expect(nestedTarget.manualKeyframeTracks.WIDTH.keyframes[0].value.value).toBe(270);
 expect(nestedTarget.manualKeyframeTracks.WIDTH.keyframes[0].timelinePosition).toBe(1.2);
});
it('fails ambiguous duplicate source IDs without removing artwork',()=>{
 const {api,node,meta}=runtime(code),root=node(),source=node(),a=node(),b=node();root.appendChild(a);root.appendChild(b);meta(a,'masterSourceId',source.id);meta(b,'masterSourceId',source.id);
 expect(()=>api.layerForSource(root,source,'custom.group')).toThrow();expect(root.children.length).toBe(2);
});

it('commits nested strip text changes into the existing hierarchy',async()=>{
 const {api,node,meta}=runtime(code),real=node(),working=node(),realGroup=node(),workGroup=node(),realText=node('TEXT','Headline',{characters:'Old'}),workText=node('TEXT','Headline',{characters:'New',width:60,fontSize:12});
 real.appendChild(realGroup);working.appendChild(workGroup);realGroup.appendChild(realText);workGroup.appendChild(workText);
 for(const n of [realGroup,workGroup])meta(n,'masterSourceId','source-group');
 for(const n of [realText,workText])meta(n,'masterSourceId','source-text');
 await api.commitWorkingChildren(real,working);
 expect(real.children[0]).toBe(realGroup);expect(realGroup.children[0]).toBe(realText);
 expect(realText.characters).toBe('New');expect(realText.width).toBe(60);expect(realGroup.children.length).toBe(1);
});
it('does not coerce mixed typography symbols to numbers',()=>{
 const {api,node,figma}=runtime(code),text=node('TEXT','Headline',{fontSize:figma.mixed,lineHeight:figma.mixed});
 expect(api.textRhythm(text)).toBe(null);
});
