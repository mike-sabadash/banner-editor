import { describe, expect, it } from "vitest";
import { editorActions, getEditorState } from "./core/editorStore";
import {
  figmaCampaignToProject,
  isFigmaCampaign,
  type FigmaCampaignDocument,
} from "./figmaCampaign";

describe("Figma campaign exchange", () => {
  it("imports editable formats and Motion keyframes", () => {
    editorActions.newProject();
    const source: FigmaCampaignDocument = {
      schema: "banner-campaign/figma-v1",
      campaign: { id: "c1", name: "Figma launch" },
      formats: [
        {
          id: "f1",
          name: "Medium",
          width: 300,
          height: 250,
          duration: 6,
          layers: [
            {
              id: "n1",
              slotId: "headline",
              name: "Headline",
              type: "TEXT",
              x: 30,
              y: 25,
              width: 180,
              height: 50,
              text: "Hello",
              fontSize: 32,
              motion: {
                opacity: [
                  { time: 0, value: 0, easing: "EASE_OUT" },
                  { time: 0.6, value: 100 },
                ],
              },
            },
          ],
        },
      ],
    };
    expect(isFigmaCampaign(source)).toBe(true);
    const project = figmaCampaignToProject(source, getEditorState());
    expect(project.title).toBe("Figma launch");
    expect(project.elementsByFormat.medium[0]).toMatchObject({
      id: "figma:headline",
      x: 10,
      y: 10,
      text: "Hello",
      contentLinked: true,
    });
    expect(project.keyframesByFormat.medium["figma:headline"]).toHaveLength(2);
  });
});
