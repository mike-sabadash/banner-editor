import {describe,it,expect} from 'vitest';
import {applyTT,mergePlacements,summarizeTT} from './post-create-tt-model.js';

describe('post-create TT management',()=>{
  it('keeps a created format valid with incomplete TT',()=>{expect(summarizeTT([{platform:'',placement:'',requirements:{}}])).toEqual({total:1,ready:0,incomplete:1})});
  it('adds multiple placements to one creative size without duplicating an existing placement',()=>{const a={platform:'Yandex Direct',placement:'CPM',requirements:{maxZipKb:512}};const b={platform:'AdRiver',placement:'ROS',requirements:{maxDurationSec:30}};const merged=mergePlacements([a],[b,a]);expect(merged).toHaveLength(2);expect(merged.map(x=>x.platform)).toEqual(['Yandex Direct','AdRiver'])});
  it('applies TT only to the selected placement and preserves the other placement',()=>{const rows=mergePlacements([],[{platform:'Yandex Direct',placement:'CPM'},{platform:'AdRiver',placement:'ROS'}]);const next=applyTT(rows,p=>p.platform==='Yandex Direct',{sourceId:'yandex-direct',sourceTitle:'Yandex Direct',checkedAt:'2026-09-05',requirements:{maxZipKb:512,maxDurationSec:30,clickTag:true}});expect(next[0].ttStatus).toBe('ready');expect(next[0].requirements.maxZipKb).toBe(512);expect(next[1].ttStatus).toBe('incomplete');expect(next[1].requirements.maxZipKb).toBeNull()});
});
