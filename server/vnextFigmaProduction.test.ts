import {describe,expect,it} from 'vitest';
import {productionCampaign} from '../src/mvp2/production.mjs';
import {applyCreativePublish,figmaSpecFromCampaign} from './mvp2Contract.mjs';
import {createCampaignBuildManifest} from './mvp2Builds.mjs';
import {campaignCompliance} from './mvp2Compliance.mjs';

const campaign=()=>({
 id:'figma-campaign',name:'Figma production',status:'creative',mediaPlanVersion:3,ttSnapshotVersion:2,creativeVersion:0,
 contentVariants:[{id:'ru',name:'RU',language:'ru',headline:'Новая коллекция',copy:'Уже в продаже',cta:'Подробнее',legal:'18+'}],
 placements:[{id:'p1',platform:'AdFox',placement:'Homepage',width:300,height:250,creativeType:'HTML5',contentVariantIds:['ru'],requirements:{sourceLabel:'Client TT',maxZipKb:150,maxDurationSec:6,clickTag:true,clickUrl:'https://example.test/click',legal:'18+'}}],
 formats:[{id:'fmt-300x250',width:300,height:250,size:'300×250',placementIds:['p1'],creativeState:'missing',creativeVersion:0}]
});

describe('Figma semantic production publication',()=>{
 it('exposes content, publishes a rendered variant, exports it and blocks it after content changes',()=>{
  const source:any=campaign(),spec=figmaSpecFromCampaign(source);
  expect(spec.contentVariants).toEqual(source.contentVariants);
  const preview='<!doctype html><html lang="ru"><body>Новая коллекция · Уже в продаже · Подробнее · 18+</body></html>';
  const publication=applyCreativePublish(source,{formats:[{formatId:'fmt-300x250',variantRenders:{ru:{previewHtml:preview,previewType:'html',durationSec:1,estimatedZipKb:12,safeZonePassed:true,presentElements:['headline.primary','copy.secondary','cta.primary','legal.primary'],productionIssues:[]}}}]});
  const published:any={...source,...publication.patch};
  expect(published.formats[0]).toMatchObject({sourceType:'figma',creativeState:'published'});
  expect(productionCampaign(published).formats[0].previewHtml).toContain('Новая коллекция');
  expect(campaignCompliance(published).summary).toEqual({ready:1,warning:0,blocked:0,total:1});
  expect(createCampaignBuildManifest(published)).toMatchObject({state:'ready',placements:[{placementId:'p1::ru'}]});
  published.contentVariants[0].headline='Изменённый заголовок';
  expect(campaignCompliance(published).summary.blocked).toBe(1);
  expect(createCampaignBuildManifest(published).state).toBe('blocked');
 });
});
