import {describe,it,expect,vi,beforeEach} from 'vitest';
const runtime=require('./cloud-runtime.js');

describe('Figma Cloud runtime',()=>{
 beforeEach(()=>vi.restoreAllMocks());
 it('normalizes cloud spec without duplicate creative semantics',()=>{
  expect(runtime.formatsFromSpec({formats:[{formatId:'f1',width:300,height:250,placementIds:['p1','p2']}]})).toEqual([{id:'f1',width:300,height:250,family:'',placements:[{id:'p1'},{id:'p2'}],conflicts:[]}]);
 });
 it('loads authenticated campaign specification',async()=>{
  const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({campaignId:'c1',formats:[]})});
  vi.stubGlobal('fetch',fetchMock);
  await runtime.loadCloudSpec('c1','token-1');
  expect(fetchMock).toHaveBeenCalledWith('https://ads.rechord.online/api/campaigns/c1/figma-spec',expect.objectContaining({headers:expect.objectContaining({authorization:'Bearer token-1'})}));
 });
 it('publishes only creative metadata through dedicated endpoint',async()=>{
  const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({ok:true})});
  vi.stubGlobal('fetch',fetchMock);
  await runtime.publishCloudCreative('c1','token-1',[{formatId:'f1',durationSec:6,previewType:'figma'}]);
  const [,options]=fetchMock.mock.calls[0];
  expect(options.method).toBe('POST');
  expect(JSON.parse(options.body)).toEqual({formats:[{formatId:'f1',previewUrl:'',previewType:'figma',durationSec:6}]});
  expect(fetchMock.mock.calls[0][0]).toContain('/creative-publish');
 });
 it('refuses unauthenticated cloud actions',async()=>{
  await expect(runtime.loadCloudSpec('c1','')).rejects.toThrow('Cloud session token is required');
 });
});
