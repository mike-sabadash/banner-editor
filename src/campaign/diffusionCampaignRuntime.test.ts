import {describe,expect,it} from 'vitest';
import {buildCampaignBundle,type BannermaticCampaign} from '../../vendor/diffusionstudio-editor/apps/web/src/bannermatic/campaign';
import {decodeStandaloneBundle,encodeStandaloneBundle} from '../../vendor/diffusionstudio-editor/apps/web/src/projects/standalone-model';

const campaign:BannermaticCampaign={
 id:'campaign-1',name:'Campaign 1',locale:'en',
 formats:[
  {id:'fmt-1200x628',width:1200,height:628,size:'1200×628',placementIds:['placement-1'],creativeState:'missing'},
  {id:'fmt-300x600',width:300,height:600,size:'300×600',placementIds:['placement-2'],creativeState:'missing'},
  {id:'fmt-240x400',width:240,height:400,size:'240×400',placementIds:['placement-3'],creativeState:'missing'},
  {id:'fmt-300x250',width:300,height:250,size:'300×250',placementIds:['placement-4'],creativeState:'missing'},
  {id:'fmt-728x90',width:728,height:90,size:'728×90',placementIds:['placement-5'],creativeState:'missing'},
  {id:'fmt-320x50',width:320,height:50,size:'320×50',placementIds:['placement-6'],creativeState:'missing'},
 ],
 placements:['1200x628','300x600','240x400','300x250','728x90','320x50'].map((size,index)=>{
  const [width,height]=size.split('x').map(Number);
  return{id:`placement-${index+1}`,platform:'Network',placement:size,width,height,requirements:{exportType:index?'html5':'jpg',maxDurationSec:6}};
 }),
};

describe('Diffusion campaign runtime bundle',()=>{
 it('creates a real Scene and Rect background for every media-plan format',()=>{
  const code=buildCampaignBundle(campaign,'fmt-728x90');
  const model=decodeStandaloneBundle(code)!;
  const scenes=model.nodes.filter(node=>node.tag==='Scene');
  expect(scenes).toHaveLength(6);
  expect(model.nodes.filter(node=>node.tag==='Rect')).toHaveLength(6);
  expect(model.nodes.find(node=>node.source.endsWith('fmt-728x90'))?.props.active).toBe(true);
  for(let index=1;index<scenes.length;index++){
   const previous=scenes[index-1].props;
   const current=scenes[index].props;
   expect(Number(current.x)).toBeGreaterThan(Number(previous.x)+Number(previous.width));
  }
  expect(code).toContain('createElement("Rect")');
  expect(code).not.toContain('createElement("rect")');
 });

 it('reflows overlapping artboards restored from an older campaign save',()=>{
  const model=decodeStandaloneBundle(buildCampaignBundle(campaign))!;
  for(const scene of model.nodes.filter(node=>node.tag==='Scene'))scene.props={...scene.props,x:0,y:0};
  const restored=decodeStandaloneBundle(buildCampaignBundle(campaign,'',encodeStandaloneBundle(model)))!;
  const xPositions=restored.nodes.filter(node=>node.tag==='Scene').map(scene=>scene.props.x);
  expect(new Set(xPositions).size).toBe(6);
 });

 it('migrates lowercase composition tags from previously saved browser projects',()=>{
  const legacy={version:1 as const,campaignId:'campaign-1',nodes:[
   {source:'stage',tag:'Stage',props:{}},
   {source:'scene',tag:'Scene',parent:'stage',props:{}},
   {source:'rect',tag:'rect',parent:'scene',props:{}},
   {source:'text',tag:'text',parent:'scene',props:{}},
  ]};
  const marker=`/* BANNERMATIC_STANDALONE_MODEL:${btoa(JSON.stringify(legacy))} */`;
  expect(decodeStandaloneBundle(marker)?.nodes.map(node=>node.tag)).toEqual(['Stage','Scene','Rect','Text']);
 });
});
