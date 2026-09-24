import {describe,expect,it} from "vitest";
import {calculateFitZoom} from "./transformMath";

describe("transform viewport",()=>{
 it("zooms out until an oversized selection and its handles fit",()=>{
  expect(calculateFitZoom(1,{width:800,height:500},{width:1200,height:700},48)).toBeCloseTo(.5771,3);
 });
 it("does not zoom in a selection that is already accessible",()=>{
  expect(calculateFitZoom(.75,{width:800,height:500},{width:300,height:180},48)).toBe(.75);
 });
 it("keeps a practical minimum zoom",()=>{
  expect(calculateFitZoom(1,{width:300,height:200},{width:10000,height:10000},48)).toBe(.1);
 });
});
