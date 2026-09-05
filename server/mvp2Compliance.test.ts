import {describe,it,expect} from 'vitest';
import {campaignCompliance,placementCompliance} from './mvp2Compliance.mjs';
const placement={id:'p1',platform:'Yandex',placement:'ROS',width:300,height:250,requirements:{maxZipKb:150,maxDurationSec:6,clickTag:true,tracking:true,impressionUrl:'https://tracker.test/pixel',sourceLabel:'Client TT'}};
const base={id:'c1',creativeVersion:2,mediaPlanVersion:1,ttSnapshotVersion:1,placements:[placement],formats:[{id:'f1',width:300,height:250,placementIds:['p1'],creativeState:'published',estimatedZipKb:120,durationSec:5,clickTagPresent:true}]};
describe('MVP2 compliance',()=>{
 it('marks fully compliant placement ready',()=>{const result=placementCompliance(base,placement);expect(result.status).toBe('ready');expect(result.checks.every(c=>c.status==='ready')).toBe(true)});
 it('blocks oversize or over-duration creative',()=>{const c={...base,formats:[{...base.formats[0],estimatedZipKb:180,durationSec:8}]};const result=placementCompliance(c,placement);expect(result.status).toBe('blocked');expect(result.checks.find(c=>c.name==='zip')?.status).toBe('blocked');expect(result.checks.find(c=>c.name==='duration')?.status).toBe('blocked')});
 it('preserves unknown instead of inventing unpublished metadata',()=>{const c={...base,formats:[{...base.formats[0],estimatedZipKb:undefined,durationSec:undefined,clickTagPresent:undefined}]};const result=placementCompliance(c,placement);expect(result.status).toBe('warning');expect(result.unknown).toBeGreaterThan(0)});
 it('summarizes readiness N/N',()=>{expect(campaignCompliance(base).summary).toEqual({ready:1,warning:0,blocked:0,total:1})});
});
