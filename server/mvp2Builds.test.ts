import {describe,it,expect} from 'vitest';
import {createCampaignBuildManifest} from './mvp2Builds.mjs';
const placement={id:'p1',platform:'Yandex',placement:'ROS',width:300,height:250,requirements:{maxZipKb:150,maxDurationSec:6,sourceLabel:'Client TT',impressionUrl:'https://tracker/p',clickUrl:'https://click'}};
const ready={id:'c1',name:'Launch',creativeVersion:4,mediaPlanVersion:2,ttSnapshotVersion:3,placements:[placement],formats:[{id:'f1',width:300,height:250,placementIds:['p1'],creativeState:'published',creativeVersion:4,estimatedZipKb:120,durationSec:5,previewHtml:'<!doctype html><html><body>Ad</body></html>',previewType:'html'}]};
describe('MVP2 campaign builds',()=>{
 it('pins all campaign versions and placement-specific creative payload in a reproducible manifest',()=>{const b=createCampaignBuildManifest(ready);expect(b.pins).toEqual({creativeVersion:4,mediaPlanVersion:2,ttSnapshotVersion:3});expect(b.placements[0]).toMatchObject({placementId:'p1',formatId:'f1',creativeVersion:4,previewType:'html',impressionUrl:'https://tracker/p',clickUrl:'https://click'});expect(b.placements[0].previewHtml).toContain('<!doctype html>')});
 it('is ready only when compliance has no warning or block',()=>{expect(createCampaignBuildManifest(ready).state).toBe('ready');const blocked={...ready,formats:[{...ready.formats[0],estimatedZipKb:300}]};expect(createCampaignBuildManifest(blocked).state).toBe('blocked')});
});
