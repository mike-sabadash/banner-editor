import {describe,it,expect} from 'vitest';
import {creativeSnapshot} from './mvp2CreativeVersions.mjs';

describe('MVP2 creative versions',()=>{
 it('captures published creative metadata without campaign TT state',()=>{
  const snapshot=creativeSnapshot({id:'c1',creativeVersion:3,formats:[{id:'f1',width:300,height:250,size:'300×250',creativeState:'published',creativeVersion:2,previewUrl:'https://preview',previewHtml:'<!doctype html><html><body>Live</body></html>',previewType:'html',durationSec:6,estimatedZipKb:120,publishedAt:'2026-09-05T00:00:00Z'},{id:'f2',width:728,height:90,size:'728×90',creativeState:'missing',creativeVersion:0}]},{touched:['f1']});
  expect(snapshot.version).toBe(3);
  expect(snapshot.touched).toEqual(['f1']);
  expect(snapshot.formats).toHaveLength(1);
  expect(snapshot.formats[0]).toMatchObject({formatId:'f1',creativeVersion:2,previewType:'html',durationSec:6,estimatedZipKb:120});
  expect(snapshot.formats[0].previewHtml).toContain('<!doctype html>');
  expect(snapshot).not.toHaveProperty('placements');
 });
});
