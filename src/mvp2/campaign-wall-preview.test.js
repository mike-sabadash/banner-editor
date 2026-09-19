import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const wall=readFileSync(new URL('./CampaignWall.tsx',import.meta.url),'utf8');
describe('Campaign Wall published previews',()=>{
 it('renders real Figma SVG snapshots before live HTML exists',()=>{
  expect(wall).toContain('format.previewSvg');
  expect(wall).toContain('srcDoc={svgDoc(format.previewSvg)}');
  expect(wall).toContain('Figma snapshot');
 });
 it('treats only HTML/URL representations as live playback',()=>{
  expect(wall).toContain('const isLive=(format:VisualFormat)=>Boolean(format.previewHtml||format.previewUrl)');
  expect(wall).toContain('const liveCount');
  expect(wall).toContain('disabled={!liveCount}');
  expect(wall).toContain("const previewLabel=isLive(format)?'Live HTML':format.previewSvg?'Figma snapshot':'Not published'");
 });
 it('renders self-contained published HTML in a script-enabled sandbox',()=>{
  expect(wall).toContain('srcDoc={format.previewHtml}');
  expect(wall).toContain('sandbox="allow-scripts"');
  expect(wall).toContain("frame.current?.contentWindow?.postMessage(command,'*')");
 });
});
