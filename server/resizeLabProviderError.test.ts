import {it,expect} from 'vitest';
import {resizeLabProviderError} from './resizeLabProviderError.mjs';
import {runResizeLabImage,approvedRolloutInput} from './resizeLabImage.mjs';
it('preserves the exact credit refusal reason, without credentials or extra paid calls',async()=>{
 let calls=0;
 const result=await runResizeLabImage(approvedRolloutInput({imageDataUrl:'data:image/png;base64,AAAA',target:{width:320,height:50},family:'micro'}),{apiKey:'secret',model:'test',fetchImpl:async()=>{calls++;return {ok:false,status:402,json:async()=>({error:{message:'Requires more credits for this request',metadata:{limit_source:'openrouter_credits'}}})}}});
 expect(calls).toBe(1);expect(result.error).toContain('Requires more credits for this request');expect(result.providerError.limitSource).toBe('openrouter_credits');expect(result.imageDataUrl).toBeUndefined();expect(result.cost).toBeNull();
});
it('distinguishes key limits from temporary in-flight budgets',async()=>{
 for(const [source,phrase] of [['openrouter_key_limit','API-ключа'],['openrouter_in_flight_budget','временный бюджет']]){
  const result=await resizeLabProviderError({status:402,json:async()=>({error:{metadata:{limit_source:source}}})});expect(result.error).toContain(phrase);
 }
});
it('redacts credentials and handles unreadable error responses',async()=>{
 const result=await resizeLabProviderError({status:402,json:async()=>({error:{message:'sk-or-v1-private Bearer secret data:image/png;base64,SECRET'}})});
 expect(result.error).not.toContain('private');expect(result.error).not.toContain('SECRET');expect(result.error).not.toContain('Bearer secret');
 const fallback=await resizeLabProviderError({status:402,json:async()=>{throw Error('HTML')}});expect(fallback.error).toContain('HTTP 402');
});
