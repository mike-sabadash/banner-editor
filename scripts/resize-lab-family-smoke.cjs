const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1600,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.text().startsWith('motion-check'))console.log(m.text())});
 const image='data:image/svg+xml;base64,'+Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250"><rect width="300" height="250" fill="purple"/></svg>').toString('base64');
 const logo='data:image/svg+xml;base64,'+Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="30"><rect width="120" height="30" fill="red"/></svg>').toString('base64');
 const state={image,logoImage:logo,logoWidth:100,selected:['300x250','336x280','728x90'],results:Object.fromEntries(['300x250','336x280','728x90'].map(id=>[id,{image,layout:{},status:'ready'}]))};let saved;
 await page.addInitScript(()=>localStorage.setItem('rl-token','test-token'));
 await page.route('**/api/resize-lab/projects/default',async route=>{if(route.request().method()==='PUT'){saved=route.request().postDataJSON().state;await route.fulfill({json:{ok:true}})}else await route.fulfill({json:{state:saved||state}})});
 await page.goto(process.env.RESIZE_LAB_URL||'http://127.0.0.1:5173/?view=resize-lab');
 const card=id=>page.locator('.rl-format-card').filter({has:page.locator('header strong',{hasText:id})});const a=card('300x250'),b=card('336x280');
 await a.getByRole('button',{name:'Двигать слои'}).click();const png=a.locator('[data-edit-layer="logo"] img');await png.scrollIntoViewIfNeeded();const before=await png.boundingBox();await page.mouse.move(before.x+10,before.y+10);await page.mouse.down();await page.mouse.move(before.x-8,before.y+10,{steps:3});await page.mouse.up();const after=await png.boundingBox();if(!(after.x<before.x-10))throw Error('PNG cannot move left '+JSON.stringify({before,after,transform:await a.locator('[data-edit-layer="logo"]').getAttribute('style')}));
 await a.locator('.rl-format-settings>summary').click();
 const slider=async(sel,val)=>a.locator(sel).evaluate((el,v)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},val);await slider('input[aria-label="300x250 visual scale"]','1.5');await slider('input[aria-label="300x250 logo width"]','60');await a.getByRole('button',{name:/Применить к семейству/}).click();await page.getByLabel('Размер логотипа',{exact:true}).check();await page.getByRole('button',{name:'Применить правки',exact:true}).click();
 const width=await b.locator('[data-edit-layer="logo"] img').evaluate(el=>parseFloat(el.style.width));if(Math.abs(width-67.2)>.01)throw Error('Family logo scaling failed '+width);
 const visual=await b.locator('.rl-visual').getAttribute('style');if(!visual.includes('scale(1.5)'))throw Error('Family visual transform failed');
 const other=await card('728x90').locator('[data-edit-layer="logo"] img').evaluate(el=>parseFloat(el.style.width));if(other!==100)throw Error('Unrelated family changed');
 await a.locator('input[type=file]').setInputFiles({name:'replacement.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250"><rect width="300" height="250" fill="blue"/></svg>')});
 await page.getByRole('tab',{name:'Анимация',exact:true}).click();await page.getByLabel('Exit animation').selectOption('fade');await page.waitForTimeout(1400);if(saved?.results?.['336x280']?.logoWidth!==67.2||saved.motion.exit!=='fade')throw Error('Settings not saved');
 await page.getByRole('button',{name:/Replay animation/}).click();await b.locator('[data-edit-layer="logo"]').evaluate(async el=>{const animations=el.getAnimations();console.log('motion-check',JSON.stringify({count:animations.length,name:getComputedStyle(el).animationName,delay:getComputedStyle(el).animationDelay,duration:getComputedStyle(el).animationDuration,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches}));if(!animations.length)throw Error('Exit animation missing: '+el.closest('.rl-auto-canvas').outerHTML.slice(0,300));await Promise.all(animations.map(a=>a.finished));if(Number(getComputedStyle(el).opacity)>.01)throw Error('Exit animation did not hide logo: '+getComputedStyle(el).opacity)});
 await page.reload();await page.getByRole('tab',{name:'Анимация',exact:true}).click();await page.waitForTimeout(200);if(await page.getByLabel('Exit animation').inputValue()!=='fade')throw Error('Motion did not restore');if(errors.length)throw Error(errors.join('\n'));

 // The initial Design rollout must send the actual measured overlays, including
 // family-inherited logo size and manual offsets, for every target.
 await page.getByRole('tab',{name:'Дизайн',exact:true}).click();
 const layoutRequests=[];
 await page.route('**/api/resize-lab/adapt',async route=>{
  const body=route.request().postDataJSON();layoutRequests.push(body);
  if(body.overlayLayout?.units!=='normalized')throw Error('Missing overlay geometry');
  const keys=body.overlayLayout.zones.map(z=>z.key);
  for(const key of ['logo','headline','cta'])if(!keys.includes(key))throw Error('Missing Design zone '+key);
  if(body.target.height===90&&keys.includes('subline'))throw Error('Invisible strip subline was reserved');
  for(const z of body.overlayLayout.zones)if(z.x<0||z.y<0||z.x+z.width>1.00001||z.y+z.height>1.00001)throw Error('Unbounded overlay zone');
  await route.fulfill({json:{imageDataUrl:image}});
 });
 await page.getByRole('button',{name:'Smart rollout · 3 formats',exact:true}).click();
 await page.getByRole('button',{name:'Smart rollout · 3 formats',exact:true}).waitFor();
 if(layoutRequests.length!==3)throw Error('Not all Design formats received measured layout');
 const logoZone=layoutRequests.find(r=>r.target.width===336).overlayLayout.zones.find(z=>z.key==='logo');
 if(logoZone.x>=.07)throw Error('Family-inherited left override missing from AI layout '+JSON.stringify(logoZone));
 if(process.env.RESIZE_LAB_UI_SCREENSHOT){
 await page.getByRole('tab',{name:'Анимация',exact:true}).click();
 await page.getByLabel('Exit animation').selectOption('none');
 await page.getByRole('tab',{name:'Дизайн',exact:true}).click();
 const top=await page.locator('.rl-body').boundingBox();const account=await page.locator('.rl-account-bar').boundingBox();
 if(top.y<account.y+account.height-1)throw Error('Account bar overlaps workspace');
 await a.locator('.rl-format-settings>summary').click();
 const exact=a.getByLabel('300x250 visual scale exact value');await exact.fill('2');
 if(await a.getByLabel('300x250 visual scale',{exact:true}).inputValue()!=='2')throw Error('Precise value does not update range');
 await exact.fill('1.5');
 await page.screenshot({path:process.env.RESIZE_LAB_UI_SCREENSHOT});
}
 // Family application in scene two must not leak into scene three, which keeps the background.
 const own='data:image/svg+xml;base64,'+Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250"><rect width="300" height="250" fill="#265544"/></svg>').toString('base64');
 const copy={headline:'H',subline:'S',cta:'C'},keys=['background','logo','headline','subline','cta','overlay'];const layers=()=>Object.fromEntries(keys.map(k=>[k,{action:k==='overlay'?'hide':'keep',x:50,y:50,width:40,motion:{preset:'none',exit:'none'}}]));
 saved={...state,scenes:[0,1,2].map(i=>({id:'family-scene-'+i,name:'Сцена '+(i+1),copy,duration:4000,motion:{preset:'none',exit:'none'},layers:layers()}))};saved.scenes[1].layers.background={...saved.scenes[1].layers.background,action:'change',image:own,adaptations:{'300x250':{image:own,adapted:true,visual:{scale:1.7,x:10,y:2},logoWidth:60,overrides:{headline:{x:15,y:10}}},'336x280':{image,adapted:true}}};let baseline;await page.reload();await page.locator('.rl-auto-canvas').first().waitFor();await page.getByRole('tab',{name:'Анимация',exact:true}).click();await page.locator('.rl-scene-list button').nth(1).click();await page.getByRole('tab',{name:'Сцена',exact:true}).click();await page.getByLabel('Длительность сцены',{exact:true}).fill('4.1');await page.waitForTimeout(50);await page.getByLabel('Длительность сцены',{exact:true}).fill('4');await page.waitForTimeout(1300);assert.equal(saved.scenes[0].motion.duration,600);baseline=JSON.stringify(saved.scenes);await a.locator('.rl-format-settings>summary').click();await a.getByRole('button',{name:/Применить к семейству/}).click();const familyDialog=page.getByRole('dialog',{name:'Применить правки к семейству',exact:true});await familyDialog.waitFor();assert.equal(await familyDialog.getByText('Сцена 2 · источник 300x250',{exact:true}).count(),1);assert.equal(await familyDialog.getByText('336x280',{exact:true}).count(),1);await familyDialog.getByLabel('Размер логотипа',{exact:true}).check();await familyDialog.getByRole('button',{name:'Применить правки',exact:true}).click();await page.waitForTimeout(1300);
 assert.equal(saved.scenes[1].formatOverrides['336x280'].visual.scale,1.7);assert.equal(saved.scenes[1].formatOverrides['336x280'].image,undefined);assert.equal(saved.scenes[1].layers.background.adaptations['336x280'].image,image);assert.equal(JSON.stringify(saved.scenes[0]),JSON.stringify(JSON.parse(baseline)[0]));assert.equal(JSON.stringify(saved.scenes[2]),JSON.stringify(JSON.parse(baseline)[2]));assert((await b.locator('.rl-visual').getAttribute('style')).includes('scale(1.7)'));assert(Math.abs(await b.locator('[data-edit-layer="logo"] img').evaluate(el=>parseFloat(el.style.width))-67.2)<.01);
 await page.locator('.rl-scene-list button').nth(2).click();assert(!(await b.locator('.rl-visual').getAttribute('style')).includes('scale(1.7)'));await page.reload();await page.locator('.rl-auto-canvas').first().waitFor();await page.getByRole('tab',{name:'Анимация',exact:true}).click();await page.locator('.rl-scene-list button').nth(1).click();assert((await b.locator('.rl-visual').getAttribute('style')).includes('scale(1.7)'));
 await a.locator('.rl-format-settings>summary').click();await a.getByRole('button',{name:/Применить к семейству/}).click();for(const width of [900,390,320]){await page.setViewportSize({width,height:1000});assert(await familyDialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1));}await familyDialog.getByRole('button',{name:'Отмена',exact:true}).click();
 console.log('PASS: selective family application, scene isolation across following keep scenes, retained independent images, reload, responsive scoped dialog; PNG left drag, family proportional logo/visual inheritance, unrelated family isolation, per-format upload, autosave and reload, exit animation, measured Design AI overlay zones');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
