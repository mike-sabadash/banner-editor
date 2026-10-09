import { describe, expect, it } from "vitest";
import { shouldRenderResizeLab } from "./resizeLabRoute";

describe("shouldRenderResizeLab", () => {
  it("opens Resize Lab directly on its production hostname", () => {
    expect(shouldRenderResizeLab({
      hostname: "resize-lab.bannermatic.online",
      search: "",
    })).toBe(true);
  });

  it("keeps the query-param preview available on other hosts", () => {
    expect(shouldRenderResizeLab({
      hostname: "localhost",
      search: "?view=resize-lab",
    })).toBe(true);
  });

  it("does not replace the main Studio entry", () => {
    expect(shouldRenderResizeLab({
      hostname: "studio.bannermatic.online",
      search: "",
    })).toBe(false);
  });
});
