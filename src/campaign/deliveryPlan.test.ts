import { describe, expect, it } from "vitest";
import { matchPlanFormats, parseDelimited, type DeliveryPlan } from "./deliveryPlan";

describe("delivery plan foundation",()=>{
 it("parses semicolon-delimited media plan rows without losing URLs",()=>{
  const rows=parseDelimited("Platform;Format;TT\nRBC;970×250;https://example.com/tt\nYandex;300x250;clickTag");
  expect(rows).toEqual([
   ["Platform","Format","TT"],
   ["RBC","970×250","https://example.com/tt"],
   ["Yandex","300x250","clickTag"],
  ]);
 });

 it("matches normalized media-plan sizes without mutating creative formats",()=>{
  const plan:DeliveryPlan={sources:[],placements:[],uniqueFormats:["300×250","970×250","320×50"],needsAi:0,createdAt:1};
  const result=matchPlanFormats(plan,["300 × 250","320 × 50","728 × 90"]);
  expect(result.matched).toEqual(["300×250","320×50"]);
  expect(result.missing).toEqual(["970×250"]);
  expect(result.coverage).toBe(67);
 });
});
