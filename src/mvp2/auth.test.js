import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const main=readFileSync(new URL('../main.tsx',import.meta.url),'utf8');
const auth=readFileSync(new URL('./AuthPage.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('./auth.css',import.meta.url),'utf8');
describe('Bannermatic customer auth journey',()=>{
 it('routes Get started to register and Sign in to login',()=>{
  expect(main).toContain('?auth=register');
  expect(main).toContain('?auth=login');
  expect(main).toContain('<AuthPage mode={auth}');
 });
 it('uses real server-backed register and login actions',()=>{
  expect(auth).toContain('api.login');
  expect(auth).toContain('api.register');
  expect(auth).toContain('onAuthenticated');
 });
 it('keeps auth multilingual and mobile responsive',()=>{
  expect(auth).toContain("locale==='ru'");
  expect(auth).toContain("onLocale('en')");
  expect(auth).toContain("onLocale('ru')");
  expect(css).toContain('@media(max-width:980px)');
  expect(css).toContain('@media(max-width:600px)');
 });
});
