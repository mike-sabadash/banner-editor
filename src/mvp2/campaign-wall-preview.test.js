import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const wall=readFileSync(new URL('./CampaignWall.tsx',import.meta.url),'utf8');
describe('Campaign Wall published previews',()=>{
 it('renders real Figma SVG snapshots before live HTML exists',()=>{
  expect(wall).toContain('format.previewSvg');
  expect(wall).toContain('srcDoc={svgDoc(format.previewSvg)}');
  expect(wall).toContain('Figma snapshot');
 });
 it('does not pretend snapshots are live playback',()=>{
  expect(wall).toContain('const liveCount');
  expect(wall).toContain('disabled={!liveCount}');
  expect(wall).toContain("format.previewUrl?'Live HTML':format.previewSvg?'Figma snapshot':'Not published'");
 });
});
