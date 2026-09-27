import {describe,expect,it} from "vitest";
import {mkdtemp} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {DeliveryArtifactStore} from "./deliveryArtifacts.mjs";

describe("DeliveryArtifactStore",()=>{
 it("stores one current artifact per campaign, format and kind without embedding bytes in campaign JSON",async()=>{const root=await mkdtemp(path.join(os.tmpdir(),"bm-artifacts-")),store=new DeliveryArtifactStore(root);await store.put("c1","fmt-300x250",{kind:"png",mimeType:"image/png",width:300,height:250,dataBase64:Buffer.from("png-one").toString("base64")});const second=await store.put("c1","fmt-300x250",{kind:"png",mimeType:"image/png",width:300,height:250,dataBase64:Buffer.from("png-two").toString("base64")});expect(store.list("c1")).toHaveLength(1);expect(store.metadataForFormat("c1","fmt-300x250").png).toMatchObject({id:second.id,bytes:7,width:300,height:250});expect((await store.contents("c1"))["fmt-300x250:png"].content.toString()).toBe("png-two")});
 it("keeps different output representations for one reusable visual format",async()=>{const root=await mkdtemp(path.join(os.tmpdir(),"bm-artifacts-")),store=new DeliveryArtifactStore(root),base={width:300,height:250};await store.put("c1","f1",{...base,kind:"jpg",mimeType:"image/jpeg",dataBase64:Buffer.from("jpg").toString("base64")});await store.put("c1","f1",{...base,kind:"gif",mimeType:"image/gif",dataBase64:Buffer.from("gif").toString("base64")});expect(Object.keys(store.metadataForFormat("c1","f1")).sort()).toEqual(["gif","jpg"])});
 it("rejects a mismatched kind and MIME type",async()=>{const root=await mkdtemp(path.join(os.tmpdir(),"bm-artifacts-")),store=new DeliveryArtifactStore(root);await expect(store.put("c1","f1",{kind:"jpg",mimeType:"image/png",width:1,height:1,dataBase64:"YQ=="})).rejects.toThrow("Unsupported")});
});
