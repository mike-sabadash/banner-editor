import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
const ui=fs.readFileSync(new URL('./ui-v14.html',import.meta.url),'utf8');
describe('post-create TT auto resolve UX',()=>{
  it('resolves as platform is typed inside the format card',()=>{
    expect(ui).toContain('scheduleResolve');
    expect(ui).toContain('resolvePlacement');
    expect(ui).toContain('data-p="platform"');
    expect(ui).not.toContain('>Match KB + add<');
  });
  it('never invents a Mail.ru TT when no verified KB source exists',()=>{
    expect(ui).toContain('Mail.ru / VK Ads');
    expect(ui).toContain('no verified official TT source in Knowledge Base yet');
    expect(ui).toContain('Use client TT, AI, or manual requirements');
  });
  it('auto-applies only a unique KB match and keeps explicit manual editing',()=>{
    expect(ui).toContain('if(exact.length===1)kb=exact[0]');
    expect(ui).toContain('generic.length===1');
    expect(ui).toContain('sendFormatTT(f,ps)');
    expect(ui).toContain('Save manual changes');
  });
});
