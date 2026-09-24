import {describe,expect,it} from "vitest";
import {oauthConfig} from "./oauth.mjs";

const request=(language:string)=>({headers:{"accept-language":language},socket:{remoteAddress:"127.0.0.1"}} as any);

describe("OAuth provider ordering",()=>{
 it("puts VK and Yandex before Google for Russian visitors",()=>{expect(oauthConfig(request("ru-RU"))).toMatchObject({region:"ru",providers:[{id:"vk"},{id:"yandex"},{id:"google"}]})});
 it("puts Google first for visitors outside the Russian locale fallback",()=>{expect(oauthConfig(request("en-US"))).toMatchObject({region:"global",providers:[{id:"google"},{id:"yandex"},{id:"vk"}]})});
});
