import { beforeEach, describe, expect, it } from "vitest";
import { editorActions, getEditorState } from "./editorStore";

describe("linked format instances", () => {
  beforeEach(() => editorActions.newProject());

  it("shares semantic content but preserves format geometry", () => {
    editorActions.addText();
    const id=getEditorState().elementsByFormat.master[0].id;
    editorActions.setFormat("medium");
    const originalMasterX=getEditorState().elementsByFormat.master[0].x;

    editorActions.updateElement(id,{text:"Campaign headline"},false);
    editorActions.updateElement(id,{x:63},false);

    expect(getEditorState().elementsByFormat.master[0].text).toBe("Campaign headline");
    expect(getEditorState().elementsByFormat.medium[0].text).toBe("Campaign headline");
    expect(getEditorState().elementsByFormat.master[0].x).toBe(originalMasterX);
    expect(getEditorState().elementsByFormat.medium[0].x).toBe(63);
  });

  it("supports a local content override", () => {
    editorActions.addText();
    const id=getEditorState().elementsByFormat.master[0].id;
    editorActions.setFormat("mobile");
    editorActions.updateElement(id,{contentLinked:false},false);
    editorActions.updateElement(id,{text:"Short mobile copy"},false);

    expect(getEditorState().elementsByFormat.mobile[0].text).toBe("Short mobile copy");
    expect(getEditorState().elementsByFormat.master[0].text).toBe("Headline");
  });

  it("places a library asset at the requested canvas coordinates", () => {
    editorActions.addAsset({id:"hero",name:"hero.png",assetUrl:"data:image/png;base64,x",width:400,height:300,bytes:100});
    editorActions.addAssetToCanvas("hero",{x:17,y:29});
    const placed=getEditorState().elementsByFormat.master[0];
    expect(placed.x).toBe(17);
    expect(placed.y).toBe(29);
    expect(placed.contentLinked).toBe(true);
  });

  it("places images at natural size relative to the artboard", () => {
    editorActions.addAsset({id:"master-bg",name:"master-bg.png",assetUrl:"data:image/png;base64,x",width:1200,height:628,bytes:100});
    editorActions.addAssetToCanvas("master-bg");
    expect(getEditorState().elementsByFormat.master[0].width).toBe(100);
  });

  it("does not auto-key until the layer already contains a keyframe", () => {
    editorActions.addText();
    const id=getEditorState().elementsByFormat.master[0].id;
    editorActions.setPlayhead(2);
    editorActions.updateElement(id,{x:44});
    expect(getEditorState().keyframesByFormat.master[id]).toBeUndefined();
    expect(getEditorState().elementsByFormat.master[0].x).toBe(44);

    editorActions.toggleKeyAtCurrent(id);
    editorActions.setPlayhead(3);
    editorActions.updateElement(id,{x:60});
    expect(getEditorState().keyframesByFormat.master[id].some((frame)=>frame.time===3&&frame.property==="x")).toBe(true);
  });

  it("changes layer stacking order", () => {
    editorActions.addText();editorActions.addText();
    const [first,second]=getEditorState().elementsByFormat.master;
    editorActions.reorderElement(first.id,1);
    expect(getEditorState().elementsByFormat.master.map((item)=>item.id)).toEqual([second.id,first.id]);
  });

  it("edits campaign duration and constrains layers and keys", () => {
    editorActions.addText();
    const id=getEditorState().elementsByFormat.master[0].id;
    editorActions.setPlayhead(5);
    editorActions.toggleKeyAtCurrent(id);
    editorActions.setDuration(3);
    expect(getEditorState().duration).toBe(3);
    expect(getEditorState().elementsByFormat.master[0].outPoint).toBe(3);
    expect(getEditorState().keyframesByFormat.master[id].every((frame)=>frame.time<=3)).toBe(true);
    editorActions.setDuration(8);
    expect(getEditorState().elementsByFormat.master[0].outPoint).toBe(8);
  });

  it("hides a linked layer locally and removes it campaign-wide explicitly", () => {
    editorActions.addText();
    const id=getEditorState().elementsByFormat.master[0].id;
    editorActions.setFormat("medium");
    editorActions.select(id);
    editorActions.setSelectedVisibility(false,"format");
    expect(getEditorState().elementsByFormat.medium[0].visible).toBe(false);
    expect(getEditorState().elementsByFormat.master[0].visible).toBe(true);
    editorActions.removeSelectedScoped("campaign");
    expect(Object.values(getEditorState().elementsByFormat).flat().some((item)=>item.id===id)).toBe(false);
  });
});
