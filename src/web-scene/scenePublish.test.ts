import {describe,expect,it} from "vitest";
import {DEFAULT_SCENES,EMPTY_RESPONSIVE_STATE,RU_CORE_10,seedResponsiveMasters} from "./sceneModel";
import {renderSceneDocumentHtml} from "./scenePublish";

describe("Diffusion scene publish",()=>{
  it("renders an animated standalone HTML creative from the linked family output",()=>{
    const format=RU_CORE_10.find(item=>item.id==="300x250")!;
    const state=seedResponsiveMasters(DEFAULT_SCENES,[format],EMPTY_RESPONSIVE_STATE,"2026-09-29T00:00:00Z");
    const changed=structuredClone(DEFAULT_SCENES);
    changed[0].layers.find(layer=>layer.id==="headline-1")!.text="Published master change";
    const output=renderSceneDocumentHtml(changed,format,state);
    expect(output).toContain('content="width=300,height=250"');
    expect(output).toContain("Published master change");
    expect(output).toContain("@keyframes bm-left");
    expect(output).toContain("data-duration=\"2200\"");
    expect(output).not.toContain("Летний запуск");
  });
});
