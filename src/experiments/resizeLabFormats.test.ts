import {describe,expect,it} from "vitest";
import {defaultFormatIds,formatPolicy,marketFormats} from "./resizeLabFormats";

describe("Resize Lab market format rules",()=>{
  it("covers the official Yandex fixed-size set",()=>{
    for(const id of ["160x600","240x400","240x600","300x250","300x300","300x500","300x600","320x50","320x100","320x480","336x280","480x320","728x90","970x250","1000x120"]){
      expect(marketFormats.some(item=>item.id===id)).toBe(true);
    }
  });
  it("removes secondary content from micro formats",()=>{
    const policy=formatPolicy({width:320,height:50,family:"micro"});
    expect(policy.layout.subline.visible).toBe(false);
    expect(policy.layout.cta.visible).toBe(false);
    expect(policy.hidden).toEqual(["subline","cta"]);
  });
  it("keeps 24px side safe areas in 728x90",()=>{
    const policy=formatPolicy({width:728,height:90,family:"strip"});
    expect(policy.safeX).toBe(32);
    expect(policy.layout.cta.x+policy.layout.cta.w).toBeCloseTo(100-32/728*100,1);
  });
  it("keeps a useful curated default instead of charging for every format",()=>{
    expect(defaultFormatIds.length).toBeGreaterThanOrEqual(8);
    expect(defaultFormatIds.length).toBeLessThan(marketFormats.length);
  });
});
