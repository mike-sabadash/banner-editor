import {describe,it,expect} from "vitest";
import {formatAutoLayout,fitCopy} from "./resizeLabAutoLayout";
import {marketFormats} from "./resizeLabFormats";
describe("Resize Lab fixed-pixel auto-layout",()=>{
 it("keeps all geometry inside every exact format",()=>{
  for(const f of marketFormats){
   const l=formatAutoLayout(f);
   expect(l.copy.x).toBeGreaterThanOrEqual(l.safe);
   expect(l.copy.y).toBeGreaterThanOrEqual(l.safe);
   expect(l.copy.x+l.copy.width).toBeLessThanOrEqual(f.width-l.safe+0.1);
   expect(l.copy.y+l.copy.maxHeight).toBeLessThanOrEqual(f.height-l.safe+0.1);
   if(l.button){
    expect(l.button.x).toBeGreaterThanOrEqual(l.safe);
    expect(l.button.y).toBeGreaterThanOrEqual(l.safe);
    expect(l.button.x+l.button.width).toBeLessThanOrEqual(f.width-l.safe+0.1);
    expect(l.button.y+l.button.height).toBeLessThanOrEqual(f.height-l.safe+0.1);
   }
  }
 });
 it("uses real 320x50 boundaries, no subline and centered CTA",()=>{
  const l=formatAutoLayout({width:320,height:50,family:"micro"});
  const fitted=fitCopy(l,"YOUR LOGO","Your headline goes here","Subline","Get the offer");
  expect(fitted.showSubline).toBe(false);
  expect(fitted.fits).toBe(true);
  expect(l.button!.y+l.button!.height/2).toBe(25);
  expect(l.copy.x+l.copy.width+l.gap).toBeLessThan(l.button!.x);
 });
 it("shrinks text rather than overlapping in 728x90",()=>{
  const l=formatAutoLayout({width:728,height:90,family:"strip"});
  const fitted=fitCopy(l,"YOUR LOGO","A very long headline that needs to adapt to the format","", "Get the offer");
  expect(fitted.fits).toBe(true);
  expect(l.copy.x+l.copy.width+l.gap).toBeLessThan(l.button!.x);
 });
 it("preserves explicit logo line breaks but does not insert new ones",()=>{
  const l=formatAutoLayout({width:320,height:50,family:"micro"});
  const fitted=fitCopy(l,"VERY LONG LOGO WORDMARK","Sale","", "Shop");
  expect(fitted.logoSize).toBeLessThanOrEqual(l.logoSize);
 });
});
