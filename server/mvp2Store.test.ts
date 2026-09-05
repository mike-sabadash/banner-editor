import {afterEach,describe,expect,it} from "vitest";
import {mkdtemp,rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {BannermaticStore} from "./mvp2Store.mjs";

const dirs:string[]=[];
async function makeStore(){const dir=await mkdtemp(path.join(os.tmpdir(),"bannermatic-"));dirs.push(dir);return new BannermaticStore(path.join(dir,"db.json"));}
afterEach(async()=>{while(dirs.length)await rm(dirs.pop()!,{recursive:true,force:true})});

describe("BannermaticStore",()=>{
 it("registers, persists and restores authenticated owner sessions",async()=>{const store=await makeStore();const created=await store.register({email:"Owner@Example.com",password:"verystrong",name:"Mike"});expect(created.role).toBe("owner");expect(created.user.email).toBe("owner@example.com");const restored=new BannermaticStore(store.filePath);const auth=await restored.authenticate(created.token);expect(auth?.user.email).toBe("owner@example.com");expect(auth?.workspace.id).toBe(created.workspace.id)});
 it("rejects bad credentials",async()=>{const store=await makeStore();await store.register({email:"a@b.com",password:"12345678",name:"A"});await expect(store.login({email:"a@b.com",password:"wrongpass"})).rejects.toMatchObject({status:401})});
 it("creates workspace campaigns and keeps them scoped to authenticated workspace",async()=>{const store=await makeStore();const created=await store.register({email:"owner@b.com",password:"12345678",name:"Owner"});const auth=await store.authenticate(created.token);const campaign=await store.createCampaign(auth!,{name:"Nike September",locale:"ru"});expect(campaign.name).toBe("Nike September");expect(store.listCampaigns(auth!)).toHaveLength(1);const next=await store.updateCampaign(auth!,campaign.id,{placements:[{id:"p1"}],mediaPlanVersion:2});expect(next.mediaPlanVersion).toBe(2);expect(next.placements).toEqual([{id:"p1"}])});
 it("enforces role permissions",async()=>{const store=await makeStore();const created=await store.register({email:"owner@c.com",password:"12345678",name:"Owner"});const auth=await store.authenticate(created.token);expect(()=>store.requireRole({...auth!,role:"viewer"} as any,["owner","admin"])).toThrow("Forbidden")});
});
