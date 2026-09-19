import {describe,it,expect} from 'vitest';
import fs from 'node:fs';

const runtime=fs.readFileSync('figma-plugin/cloud-runtime.js','utf8');

describe('Figma Cloud runtime contract',()=>{
 it('targets the deployed Bannermatic Cloud API',()=>{
  expect(runtime).toContain('https://ads.rechord.online');
  expect(runtime).toContain('figma-spec');
  expect(runtime).toContain('creative-publish');
 });
 it('requires a cloud session token before loading or publishing',()=>{
  expect(runtime).toContain('Cloud session token is required');
  expect(runtime).toContain('authorization=`Bearer');
 });
 it('normalizes placement ids into one visual-format request',()=>{
  expect(runtime).toContain('placementIds');
  expect(runtime).toContain('placements:Array.isArray(f.placementIds)?f.placementIds.map');
  expect(runtime).toContain('filter(f=>f.width&&f.height)');
 });
 it('publishes creative metadata through the dedicated endpoint',()=>{
  expect(runtime).toContain('previewUrl');
  expect(runtime).toContain('previewType');
  expect(runtime).toContain('durationSec');
  expect(runtime).toContain('estimatedZipKb');
  expect(runtime).toContain('method:"POST"');
 });
});
