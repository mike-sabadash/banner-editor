import type {AccessRole,Campaign} from "./domain";

const BASE=(import.meta as any).env?.VITE_BANNERMATIC_API||"";
const TOKEN_KEY="bannermatic:token";
export type SessionPayload={user:{id:string,email:string,name:string};workspace:{id:string,name:string};role:AccessRole;expiresAt:string;token?:string};

function token(){return localStorage.getItem(TOKEN_KEY)||""}
export function hasToken(){return Boolean(token())}
export function saveToken(value:string){if(value)localStorage.setItem(TOKEN_KEY,value);else localStorage.removeItem(TOKEN_KEY)}
async function request<T>(path:string,init:RequestInit={}):Promise<T>{const headers=new Headers(init.headers||{});if(init.body&&!headers.has("content-type"))headers.set("content-type","application/json");if(token())headers.set("authorization",`Bearer ${token()}`);const r=await fetch(`${BASE}${path}`,{...init,headers});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||`Request failed: ${r.status}`);return data as T}
export const api={
 async register(input:{email:string,password:string,name:string}){const data=await request<SessionPayload&{token:string}>("/api/auth/register",{method:"POST",body:JSON.stringify(input)});saveToken(data.token);return data},
 async login(input:{email:string,password:string}){const data=await request<SessionPayload&{token:string}>("/api/auth/login",{method:"POST",body:JSON.stringify(input)});saveToken(data.token);return data},
 async me(){return request<SessionPayload>("/api/auth/me")},
 async logout(){try{await request("/api/auth/logout",{method:"POST"})}finally{saveToken("")}},
 async campaigns(){return request<{items:Campaign[]}>("/api/campaigns")},
 async createCampaign(name:string,locale:"en"|"ru"){return request<Campaign>("/api/campaigns",{method:"POST",body:JSON.stringify({name,locale})})},
 async updateCampaign(id:string,patch:Partial<Campaign>){return request<Campaign>(`/api/campaigns/${encodeURIComponent(id)}`,{method:"PATCH",body:JSON.stringify(patch)})},
 async compliance(id:string){return request<{campaignId:string;creativeVersion:number;mediaPlanVersion:number;ttSnapshotVersion:number;summary:{ready:number;warning:number;blocked:number;total:number};placements:Array<any>}>(`/api/campaigns/${encodeURIComponent(id)}/compliance`)},
 async figmaSpec(id:string){return request<any>(`/api/campaigns/${encodeURIComponent(id)}/figma-spec`)},
 async members(){return request<{items:Array<{id:string;role:AccessRole;user:{id:string,email:string,name:string}|null}>}>("/api/workspace/members")},
 async setRole(id:string,role:AccessRole){return request(`/api/workspace/members/${encodeURIComponent(id)}`,{method:"PATCH",body:JSON.stringify({role})})},
};
