import {describe,it,expect} from 'vitest';
import fs from 'node:fs';

describe('Bannermatic public SaaS entry',()=>{
 const main=fs.readFileSync('src/main.tsx','utf8');
 const home=fs.readFileSync('src/mvp2/MarketingHome.tsx','utf8');
 const css=fs.readFileSync('src/mvp2/marketing.css','utf8');
 it('opens the production editor directly instead of the marketing page',()=>{expect(main).toContain('return <Editor/>');expect(main).not.toContain('return <MarketingHome');expect(main).toContain('bootstrapProjectPersistence');expect(main).toContain('installEditorRuntime')});
 it('keeps Campaign Compiler as the dominant public narrative',()=>{expect(home).toContain('CAMPAIGN COMPILER FOR FIGMA');expect(home).toContain('Compile your campaign');expect(home).toContain('Campaign Wall');expect(home).toContain('LIVE COMPLIANCE')});
 it('contains public sign-in, signup and RU/EN entry points',()=>{expect(home).toContain('Sign in');expect(home).toContain('Get started');expect(home).toContain("onLocale('en')");expect(home).toContain("onLocale('ru')")});
 it('has responsive marketing rules and shared product primitives',()=>{expect(css).toContain('@media(max-width:900px)');expect(css).toContain('@media(max-width:600px)');expect(css).toContain('.bm-primary');expect(css).toContain('.bm-locale')});
});
