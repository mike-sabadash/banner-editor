// @ts-nocheck
import {afterEach,describe,expect,it} from "vitest";
import {mkdtemp,readFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {CreativeDocumentStore} from "./mvp2CreativeDocuments.mjs";
import {DEFAULT_SCENES,EMPTY_RESPONSIVE_STATE,RU_CORE_10,setLayerOverride,useAsResponsiveMaster} from "../src/web-scene/sceneModel";

const dirs:string[]=[];
afterEach(async()=>{await Promise.all(dirs.splice(0).map(dir=>rm(dir,{recursive:true,force:true})))});

describe("responsive creative document persistence",()=>{
  it("survives save and a fresh store reload while old v1 documents still load",async()=>{
    const dir=await mkdtemp(path.join(tmpdir(),"bm-responsive-"));dirs.push(dir);
    const file=path.join(dir,"documents.json"),format=RU_CORE_10.find(item=>item.id==="240x400")!;
    let responsive=setLayerOverride(EMPTY_RESPONSIVE_STATE,format.id,"scene-1","headline-1","headline",{box:{x:12,y:8,w:72,h:20}});
    responsive=useAsResponsiveMaster(DEFAULT_SCENES,format,responsive,"portrait","2026-09-15T00:00:00Z");
    responsive=setLayerOverride(responsive,"320x480","scene-1","headline-1","headline",{text:"Persistent override"});
    const document={version:2,masterFormat:{width:300,height:600},scenes:DEFAULT_SCENES,responsiveMasters:responsive.responsiveMasters,formatOverrides:responsive.formatOverrides,updatedAt:"2026-09-15T00:00:00Z"};
    const first=new CreativeDocumentStore(file);await first.set("campaign-responsive",document);
    const second=new CreativeDocumentStore(file);await second.load();
    expect(second.get("campaign-responsive")).toEqual(document);
    expect(JSON.parse(await readFile(file,"utf8")).documents["campaign-responsive"].responsiveMasters[0].sourceFormatId).toBe("240x400");
    const legacy={version:1,masterFormat:{width:300,height:600},scenes:DEFAULT_SCENES};
    await second.set("campaign-legacy",legacy);
    const third=new CreativeDocumentStore(file);await third.load();
    expect(third.get("campaign-legacy")).toEqual(legacy);
  });
});
