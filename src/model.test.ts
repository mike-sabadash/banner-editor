import { describe, expect, it } from "vitest";
import { fitPreview } from "./model";
describe("fitPreview",()=>{it("keeps aspect ratio inside viewport",()=>{expect(fitPreview(1200,628)).toEqual({width:720,height:377});expect(fitPreview(300,600)).toEqual({width:215,height:430})})});
