import {describe,it,expect} from 'vitest';
import {matchTT,resolveCampaignTT} from './mvp2TT.mjs';
const items=[{id:'yd',platform:'Yandex Direct',publisher:'Yandex',status:'verified',formats:['300×250'],sourceUrl:'https://yandex',sourceTitle:'YD',lastCheckedAt:'2026-09-04',maxZipKb:512,clickTracking:'required',tracking:'placement-specific',notes:[]},{id:'ys',platform:'Yandex Services',publisher:'Yandex',status:'verified',formats:['300×250'],sourceUrl:'https://ys',sourceTitle:'YS',lastCheckedAt:'2026-09-04',maxZipKb:512,clickTracking:'required',tracking:'placement-specific',notes:[]},{id:'old',platform:'Mail.ru',publisher:'VK',status:'needs-refresh',formats:['300×250'],notes:[]}];
describe('MVP2 TT matcher',()=>{
 it('finds a unique verified exact platform and size match',()=>{const r=matchTT({platform:'Yandex Direct',width:300,height:250},items);expect(r.status).toBe('matched');expect(r.matches[0].id).toBe('yd');expect(r.matches[0].requirements.maxZipKb).toBe(512)});
 it('does not use unverified sources',()=>{expect(matchTT({platform:'Mail.ru',width:300,height:250},items).status).toBe('not_found')});
 it('asks for placement/product when broad publisher match is ambiguous',()=>{const r=matchTT({platform:'Yandex',width:300,height:250},items);expect(r.status).toBe('ambiguous');expect(r.matches).toHaveLength(2)});
 it('resolves every placement without mutating campaign',()=>{const campaign={id:'c1',placements:[{id:'p1',platform:'Yandex Direct',width:300,height:250,requirements:{}}]};const before=JSON.stringify(campaign);expect(resolveCampaignTT(campaign).results[0].status).toBe('matched');expect(JSON.stringify(campaign)).toBe(before)});
});
