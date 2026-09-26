import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const main=readFileSync(new URL('../main.tsx',import.meta.url),'utf8');
const auth=readFileSync(new URL('./AuthPage.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('./auth.css',import.meta.url),'utf8');
describe('Bannermatic customer auth journey',()=>{
 it('opens Studio on server-backed auth and keeps registration available',()=>{
  expect(main).toContain('return <AuthPage mode={auth}');
  expect(main).toContain('params.get("auth")==="register"?"register":"login"');
  expect(main).toContain('return <BannermaticProduct/>');
  expect(main).not.toContain('return <MarketingHome');
 });
 it('uses real server-backed register and login actions',()=>{
  expect(auth).toContain('api.login');
  expect(auth).toContain('api.register');
  expect(auth).toContain('onAuthenticated');
 });
 it('requires separate legal consent and exposes regional OAuth providers',()=>{
  expect(auth).toContain('termsAccepted:true');
  expect(auth).toContain('privacyAccepted:true');
  expect(auth).toContain('/legal/terms.html');
  expect(auth).toContain('/legal/consent.html');
  expect(auth).toContain('/legal/privacy.html');
  expect(auth).toContain('oauth.providers.map');
  expect(auth).toContain('/api/auth/oauth/');
 });
 it('keeps auth multilingual and mobile responsive',()=>{
  expect(auth).toContain("locale==='ru'");
  expect(auth).toContain("onLocale('en')");
  expect(auth).toContain("onLocale('ru')");
  expect(css).toContain('@media(max-width:980px)');
  expect(css).toContain('@media(max-width:600px)');
 });
});
