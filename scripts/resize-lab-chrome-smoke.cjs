const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1600,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const image='data:image/svg+xml;base64,'+Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="400"><rect width="240" height="400" fill="#453560"/></svg>').toString('base64');
 const state={image,selected:['300x300','728x90'],results:{'300x300':{image,layout:{},status:'ready'}},costRecords:[{id:'one',formatId:'300x300',cost:.069,time:Date.now()},{id:'two',formatId:'728x90',cost:.068,time:Date.now()}]};
 await page.addInitScript(()=>localStorage.setItem('rl-token','test-token'));
 await page.route('**/api/resize-lab/projects/default',route=>route.fulfill({json:route.request().method()==='GET'?{state}:{ok:true}}));
 await page.goto(process.env.RESIZE_LAB_URL||'http://127.0.0.1:5173/?view=resize-lab');await page.locator('.rl-auto-canvas').first().waitFor();
 assert.equal(await page.locator('.rl-typography').evaluate(el=>el.open),false);
 assert.equal(await page.locator('.rl-format-settings').first().evaluate(el=>el.open),false);
 await page.locator('.rl-typography>summary').click();assert.equal(await page.locator('.rl-typography input[type=range]').first().isVisible(),true);
 await page.locator('.rl-format-settings>summary').first().click();const exact=page.getByLabel('300x300 visual scale exact value');await exact.fill('1.5');assert.equal(await page.getByLabel('300x300 visual scale',{exact:true}).inputValue(),'1.5');
 const header=await page.locator('.resize-lab>header').boundingBox();const account=await page.locator('.rl-account-bar').boundingBox();assert(account.y>=header.y&&account.y+account.height<=header.y+header.height);
 await page.getByRole('button',{name:'Расходы OpenRouter'}).click();const popover=page.locator('.rl-cost-popover');await popover.waitFor();
 for(const width of [1600,900,390,320]){
  await page.setViewportSize({width,height:800});
  const result=await popover.evaluate(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,overflow:el.scrollWidth>el.clientWidth,documentOverflow:document.documentElement.scrollWidth>innerWidth}});
  assert(result.left>=0&&result.right<=width,JSON.stringify({width,...result}));assert.equal(result.overflow,false);assert.equal(result.documentOverflow,false);
  const amount=popover.locator('.rl-cost-history b').first();assert.equal(await amount.evaluate(el=>getComputedStyle(el).color),await popover.evaluate(el=>getComputedStyle(el).color));assert(await amount.evaluate(el=>el.getBoundingClientRect().width)>30);
 }
 await page.setViewportSize({width:1600,height:1000});await page.screenshot({path:process.env.RESIZE_LAB_CHROME_SCREENSHOT||'/tmp/resize-lab-chrome.png'});
 await page.keyboard.press('Escape');await popover.waitFor({state:'detached'});assert.equal(await page.getByRole('button',{name:'Расходы OpenRouter'}).evaluate(el=>el===document.activeElement),true);
 await page.getByRole('button',{name:'Выйти',exact:true}).click();await page.locator('.rl-auth-disclosure>summary').click();await page.getByLabel('Email',{exact:true}).fill('test@example.com');await page.getByRole('button',{name:'Регистрация',exact:true}).click();assert(await page.getByLabel('Имя',{exact:true}).isVisible());assert(await page.getByRole('checkbox',{name:/Принимаю условия/}).isVisible());await page.keyboard.press('Escape');assert.equal(await page.locator('.rl-auth-disclosure').evaluate(el=>el.open),false);
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: property disclosure, exact controls, single header account, cost history and no horizontal overflow at 1600/900/390/320, Escape focus, login/registration consent');
})().catch(error=>{console.error(error);process.exit(1)});
