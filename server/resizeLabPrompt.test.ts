import {describe,expect,it} from "vitest";
import {buildResizeLabPrompt,imageAspectRatio} from "./resizeLabPrompt.mjs";

describe("Resize Lab smart art direction",()=>{
  it("bakes family direction into a one-click rollout",()=>{
    const prompt=buildResizeLabPrompt({target:{width:728,height:90},family:"strip"});
    expect(prompt).toContain("HORIZONTAL DESIGN RE-LAYOUT");
    expect(prompt).toContain("SIDE BY SIDE");
    expect(prompt).toContain("728×90");
  });
  it("keeps custom prompt optional and additive",()=>{
    const prompt=buildResizeLabPrompt({target:{width:300,height:600},family:"skyscraper",userPrompt:"Keep the red product visible"});
    expect(prompt).toContain("Faithful tall adaptation");
    expect(prompt).toContain("Additional user art direction: Keep the red product visible");
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
    expect(imageAspectRatio("strip")).toBe("21:9");
    expect(imageAspectRatio("square")).toBe("1:1");
    expect(imageAspectRatio("portrait")).toBe("3:4");
    expect(imageAspectRatio("skyscraper")).toBe("9:16");
  });
});
