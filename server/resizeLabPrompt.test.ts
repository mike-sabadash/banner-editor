import {describe,expect,it} from "vitest";
import {buildResizeLabPrompt,imageAspectRatio} from "./resizeLabPrompt.mjs";

describe("Resize Lab smart art direction",()=>{
  it("bakes family direction into a one-click rollout",()=>{
    const prompt=buildResizeLabPrompt({target:{width:728,height:90},family:"strip"});
    expect(prompt).toContain("right third");
    expect(prompt).toContain("clean negative space");
    expect(prompt).toContain("728×90");
  });
  it("keeps custom prompt optional and additive",()=>{
    const prompt=buildResizeLabPrompt({target:{width:300,height:600},family:"skyscraper",userPrompt:"Keep the red product visible"});
    expect(prompt).toContain("tall narrow composition");
    expect(prompt).toContain("Additional user art direction: Keep the red product visible");
  });
  it("requests an image shape appropriate for each family",()=>{
    expect(imageAspectRatio("strip")).toBe("21:9");
    expect(imageAspectRatio("square")).toBe("1:1");
    expect(imageAspectRatio("portrait")).toBe("3:4");
    expect(imageAspectRatio("skyscraper")).toBe("9:16");
  });
});
