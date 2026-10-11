import {describe,expect,it} from "vitest";
import {buildResizeLabPrompt,imageAspectRatio,generationViewport,normalizedZones} from "./resizeLabPrompt.mjs";

describe("Resize Lab smart art direction",()=>{
  it("bakes family direction into a one-click rollout",()=>{
    const prompt=buildResizeLabPrompt({target:{width:728,height:90},family:"strip"});
    expect(prompt).toContain("HORIZONTAL DESIGN RE-LAYOUT");
    expect(prompt).toContain("left-to-right panorama");
    expect(prompt).toContain("728×90");
  });
  it("keeps custom prompt optional and additive",()=>{
    const prompt=buildResizeLabPrompt({target:{width:300,height:600},family:"skyscraper",userPrompt:"Keep the red product visible"});
    expect(prompt).toContain("Faithful tall adaptation");
    expect(prompt).toContain("Additional user instruction: Keep the red product visible");
  });
  it("protects original square artwork from creative drift",()=>{
    const prompt=buildResizeLabPrompt({target:{width:300,height:300},family:"square"});
    expect(prompt).toContain("FAITHFUL SQUARE EDIT");
    expect(prompt).toContain("not a new campaign image");
    expect(prompt).toContain("outpaint");
  });
  it("treats ultra-wide aspect ratios as horizontal design even when family is different",()=>{
    const prompt=buildResizeLabPrompt({target:{width:728,height:90},family:"landscape"});
    expect(prompt).toContain("HORIZONTAL DESIGN RE-LAYOUT");
  });
  it("requests an image shape appropriate for each family",()=>{
    expect(imageAspectRatio("strip")).toBe("8:1");
    expect(imageAspectRatio("square")).toBe("1:1");
    expect(imageAspectRatio("portrait")).toBe("3:4");
    expect(imageAspectRatio("skyscraper")).toBe("9:16");
  });
  it("selects shapes by exact dimensions and gives the generator its surviving window",()=>{
    expect(imageAspectRatio("landscape",{width:728,height:90})).toBe("8:1");
    expect(imageAspectRatio("strip",{width:970,height:250})).toBe("4:1");
    expect(imageAspectRatio("square",{width:300,height:250})).toBe("5:4");
    expect(imageAspectRatio("portrait",{width:160,height:600})).toBe("1:4");
    const v=generationViewport({width:320,height:50},"micro");expect(v.width).toBeCloseTo(.8);expect(v.x).toBeCloseTo(.1);
    const prompt=buildResizeLabPrompt({target:{width:728,height:90},family:"strip"});expect(prompt).toContain("FINAL VISIBLE WINDOW");expect(prompt).toContain("complete heads/faces");
  });
  it("honors measured zones instead of assuming copy always stays in the upper-left",()=>{
    const prompt=buildResizeLabPrompt({target:{width:300,height:300},overlayLayout:{units:"normalized",zones:[{key:"subline",x:.5,y:.6,width:.45,height:.1}]}});
    expect(prompt).toContain("subline: x=50.0%, y=60.0%");expect(prompt).toContain("measured positions take priority");
    expect(normalizedZones({units:"normalized",zones:[{key:"bad",x:0,y:0,width:1,height:1},{key:"headline",x:NaN,y:0,width:1,height:1},{key:"cta",x:.9,y:.9,width:.5,height:.5}]})).length(1);
  });

});
