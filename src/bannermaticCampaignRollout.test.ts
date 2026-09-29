import {describe,expect,it} from 'vitest';
import {decodeStandaloneBundle,encodeStandaloneBundle,type StandaloneBundleModel} from '../vendor/diffusionstudio-editor/apps/web/src/projects/standalone-model';
import {rolloutCampaignBundle,type BannermaticCampaign} from '../vendor/diffusionstudio-editor/apps/web/src/bannermatic/campaign';

const campaign:BannermaticCampaign={id:'campaign-1',name:'Family rollout',locale:'ru',placements:[],formats:[
  {id:'300x600',width:300,height:600,size:'300×600',placementIds:[],creativeState:'draft'},
  {id:'300x250',width:300,height:250,size:'300×250',placementIds:[],creativeState:'missing'},
  {id:'728x90',width:728,height:90,size:'728×90',placementIds:[],creativeState:'missing'},
]};

function bundle(nodes:StandaloneBundleModel['nodes']){
  return encodeStandaloneBundle({version:1,campaignId:campaign.id,nodes:[
    {source:'stage',tag:'Stage',props:{}},
    {source:'scene-master',tag:'Scene',parent:'stage',props:{name:'BM_FORMAT::300x600::300x600',width:300,height:600}},
    {source:'master-bg',tag:'Rect',parent:'scene-master',props:{name:'Background',x:0,y:0,width:300,height:600}},
    {source:'scene-rect',tag:'Scene',parent:'stage',props:{name:'BM_FORMAT::300x250::300x250',width:300,height:250}},
    {source:'rect-bg',tag:'Rect',parent:'scene-rect',props:{name:'Background',x:0,y:0,width:300,height:250}},
    {source:'scene-strip',tag:'Scene',parent:'stage',props:{name:'BM_FORMAT::728x90::728x90',width:728,height:90}},
    {source:'strip-bg',tag:'Rect',parent:'scene-strip',props:{name:'Background',x:0,y:0,width:728,height:90}},
    ...nodes,
  ]});
}

describe('Diffusion campaign family rollout',()=>{
  it('turns a flattened master image into a full-bleed cover in every target instead of copying its box',()=>{
    const saved=bundle([
      {source:'photo',tag:'Rect',parent:'scene-master',props:{name:'Campaign image',x:35,y:80,width:230,height:410,start:0,end:6}},
      {source:'photo-paint',tag:'ImagePaint',parent:'photo',props:{src:'assets/campaign.png'}},
    ]);
    const result=rolloutCampaignBundle(campaign,'300x600',saved),model=decodeStandaloneBundle(result.bundle)!;
    for(const [scene,width,height] of [['scene-rect',300,250],['scene-strip',728,90]] as const){
      const image=model.nodes.find(node=>node.parent===scene&&node.link?.source==='photo')!;
      expect(image.props).toMatchObject({x:0,y:0,width,height,start:0,end:6});
      const paint=model.nodes.find(node=>node.parent===image.source&&node.link?.source==='photo-paint')!;
      expect(paint.props).toMatchObject({src:'assets/campaign.png',objectFit:'cover'});
    }
  });

  it('recomposes named layers by geometry family and preserves local target overrides',()=>{
    const saved=bundle([
      {source:'headline',tag:'Text',parent:'scene-master',props:{name:'Headline',x:24,y:72,width:252,height:96,fontSize:34,start:0,end:6},text:'Shared offer'},
      {source:'hero',tag:'Rect',parent:'scene-master',props:{name:'Product image',x:18,y:252,width:264,height:228,start:.2,end:6}},
      {source:'hero-paint',tag:'ImagePaint',parent:'hero',props:{src:'assets/product.png'}},
      {source:'cta',tag:'Text',parent:'scene-master',props:{name:'CTA button',x:24,y:504,width:150,height:48,fontSize:14,start:.5,end:6},text:'Buy'},
    ]);
    const first=rolloutCampaignBundle(campaign,'300x600',saved),model=decodeStandaloneBundle(first.bundle)!;
    const headline=model.nodes.find(node=>node.parent==='scene-strip'&&node.link?.source==='headline')!;
    const hero=model.nodes.find(node=>node.parent==='scene-strip'&&node.link?.source==='hero')!;
    const cta=model.nodes.find(node=>node.parent==='scene-strip'&&node.link?.source==='cta')!;
    expect(headline.props).toMatchObject({x:101.92,y:13.5,width:247.52,height:30.6});
    expect(hero.props).toMatchObject({x:364,y:4.5,width:182,height:81});
    expect(cta.props).toMatchObject({x:567.84,y:21.6,width:145.6,height:46.8});
    expect(headline.text).toBe('Shared offer');
    expect(hero.props).not.toMatchObject({x:43.68,y:37.8,width:640.64,height:34.2});

    headline.props.x=77;
    const second=decodeStandaloneBundle(rolloutCampaignBundle(campaign,'300x600',encodeStandaloneBundle(model)).bundle)!;
    expect(second.nodes.find(node=>node.source===headline.source)!.props.x).toBe(77);
    expect(second.nodes.find(node=>node.source===headline.source)!.text).toBe('Shared offer');
  });
});
