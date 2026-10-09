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
    expect(policy.layout.cta.visible).toBe(true);
    expect(policy.hidden).toEqual(["subline"]);
    expect(policy.layout.logo.y).toBeLessThan(policy.layout.headline.y);
    expect((policy.layout.cta.x+policy.layout.cta.w)*3.2).toBeLessThanOrEqual(320-12+0.1);
  });
  it("keeps 24px side safe areas in 728x90",()=>{
    const policy=formatPolicy({width:728,height:90,family:"strip"});
    expect(policy.safeX).toBe(32);
    expect(policy.layout.cta.x+policy.layout.cta.w).toBeCloseTo(100-32/728*100,1);
  });
  it("reserves separate copy and CTA zones in leaderboard",()=>{
    const policy=formatPolicy({width:728,height:90,family:"strip"});
    expect(policy.layout.headline.x+policy.layout.headline.w).toBeLessThan(policy.layout.cta.x);
    expect(policy.layout.headline.fontSize).toBeLessThanOrEqual(18);
  });
  it("keeps square copy narrower to leave visual space",()=>{
    const policy=formatPolicy({width:300,height:300,family:"square"});
    expect(policy.layout.headline.w).toBeLessThan(60);
    expect(policy.layout.cta.x+policy.layout.cta.w).toBeLessThan(100);
  });
  it("keeps a useful curated default instead of charging for every format",()=>{
    expect(defaultFormatIds.length).toBeGreaterThanOrEqual(8);
    expect(defaultFormatIds.length).toBeLessThan(marketFormats.length);
  });
});
