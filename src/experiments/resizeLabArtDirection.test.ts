import {describe,expect,it} from 'vitest';
import {restoreArtDirections,mergeArtDirection} from './resizeLabArtDirection';
import {restoreAdaptation} from './resizeLabSceneLayers';
const sourceHash='a'.repeat(64),id='b'.repeat(64),record={sourceHash,version:1,plans:{[id]:{strategy:'keep car/person relation'}},seal:'opaque-signature',models:{generation:'pinned-model'}};
describe('project art direction persistence',()=>{
 it('round-trips opaque signed records and unknown versions without silently migrating them',()=>{
  const restored=restoreArtDirections(JSON.parse(JSON.stringify({[sourceHash]:record})));expect(restored[sourceHash]).toEqual(record);
  expect(restoreArtDirections({[sourceHash]:{...record,version:99}})[sourceHash].version).toBe(99);
 });
 it('retains another scene source and ignores missing API metadata',()=>{
  const current={[sourceHash]:record},other={...record,sourceHash:'c'.repeat(64)};const next=mergeArtDirection(current,other);expect(next[sourceHash]).toEqual(record);expect(next[other.sourceHash]).toEqual(other);expect(mergeArtDirection(next,undefined)).toBe(next);
 });
 it('never lets an older response erase a signed record containing newer plans',()=>{
  const newer={...record,plans:{...record.plans,['d'.repeat(64)]:{strategy:'new revision'}}};expect(mergeArtDirection({[sourceHash]:newer},record)[sourceHash]).toEqual(newer);
 });
 it('preserves the format plan binding through scene restore',()=>{
  expect(restoreAdaptation({image:'',planId:id}).planId).toBe(id);expect(restoreAdaptation({image:'',planId:'bad-id'}).planId).toBeUndefined();
 });
});
