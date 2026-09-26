import {File} from 'node:buffer';
import {inflateRawSync} from 'node:zlib';
import {describe,expect,it} from 'vitest';
import {processDeliveryInput} from '../src/campaign/deliveryPlan';
import {compileVisualFormats} from '../src/mvp2/domain';
import {publishTemplate} from '../src/mvp2/production.mjs';
import {createCampaignBuildManifest} from './mvp2Builds.mjs';
import {campaignCompliance} from './mvp2Compliance.mjs';
import {campaignZip,zipFiles} from './mvp2Packaging.mjs';

const escapeXml=(value:unknown)=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]!));
const column=(index:number)=>{let value='',n=index+1;while(n){n--;value=String.fromCharCode(65+n%26)+value;n=Math.floor(n/26)}return value};
function worksheet(rows:unknown[][]){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((row,r)=>`<row r="${r+1}">${row.map((value,c)=>`<c r="${column(c)}${r+1}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`).join('')}</row>`).join('')}</sheetData></worksheet>`}
function workbook(rows:unknown[][]){return zipFiles([
 {name:'[Content_Types].xml',content:'<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'},
 {name:'_rels/.rels',content:'<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'},
 {name:'xl/workbook.xml',content:'<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Campaign" sheetId="1" r:id="rId1"/></sheets></workbook>'},
 {name:'xl/_rels/workbook.xml.rels',content:'<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'},
 {name:'xl/worksheets/sheet1.xml',content:worksheet(rows)}
 ])}
function readZip(input:Buffer){const files=new Map<string,Buffer>();let offset=0;while(offset+30<=input.length&&input.readUInt32LE(offset)===0x04034b50){const method=input.readUInt16LE(offset+8),compressed=input.readUInt32LE(offset+18),nameLength=input.readUInt16LE(offset+26),extraLength=input.readUInt16LE(offset+28),nameStart=offset+30,dataStart=nameStart+nameLength+extraLength,name=input.subarray(nameStart,nameStart+nameLength).toString('utf8'),data=input.subarray(dataStart,dataStart+compressed);files.set(name,method===8?inflateRawSync(data):Buffer.from(data));offset=dataStart+compressed}return files}

describe('representative XLSX campaign acceptance',()=>{
 it('compiles 10 placements, 5 size classes and 2 TT profiles into verified HTML5 packages',async()=>{
  const headers=['Platform','Placement','Width','Height','Max ZIP KB','Duration','ClickTag','Tracking','Click URL','Impression URL','TT URL','Language','Legal','Type'];
  const sizes=[[300,250],[240,400],[728,90],[300,600],[320,50]];
  const rows:unknown[][]=[headers];
  for(const [profile,platform] of [['yandex','Yandex'],['google','Google Ads']] as const)for(const [index,[width,height]] of sizes.entries()){
   const strip=height<=90,tracking=profile==='google';
   rows.push([platform,`${profile}-${index+1}`,width,height,profile==='google'?200:150,profile==='google'?30:15,'yes',tracking?'yes':'no',`https://example.test/${profile}/${index+1}`,tracking?`https://tracker.example.test/${profile}/${index+1}`:'',`https://specs.example.test/${profile}`,index%2?'en':'ru',strip?'':'18+','HTML5']);
  }
  const xlsx=workbook(rows),file=new File([xlsx],'pilot-media-plan.xlsx',{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  const plan=await processDeliveryInput([file as unknown as globalThis.File]);
  expect(plan.sources).toHaveLength(1);expect(plan.sources[0]).toMatchObject({status:'parsed',kind:'spreadsheet'});
  expect(plan.placements).toHaveLength(10);expect(plan.uniqueFormats).toHaveLength(5);expect(new Set(plan.placements.map(p=>p.ttUrl)).size).toBe(2);
  expect(plan.placements.filter(p=>p.requirements.tracking===true)).toHaveLength(5);expect(plan.placements.filter(p=>p.requirements.tracking===false)).toHaveLength(5);
  const contentVariants=[
   {id:'en',name:'EN standard',language:'en',headline:'Autumn sale',copy:'Selected products',cta:'Shop now',legal:'18+'},
   {id:'ru',name:'RU standard',language:'ru',headline:'Осенняя акция',copy:'Избранные товары',cta:'Подробнее',legal:'18+'},
   {id:'compact-en',name:'EN compact',language:'en',headline:'Sale',copy:'',cta:'Shop',legal:''},
   {id:'compact-ru',name:'RU compact',language:'ru',headline:'Акция',copy:'',cta:'Смотреть',legal:''}
  ];
  const placements=plan.placements.map(p=>({...p,contentVariantIds:[`${p.height<=90?'compact-':''}${p.language}`],requirements:{...p.requirements,sourceUrl:p.ttUrl,sourceLabel:p.source}}));
  const campaign:any={id:'pilot',name:'Representative XLSX pilot',status:'media-ready',locale:'ru',mediaPlanVersion:1,ttSnapshotVersion:1,creativeVersion:0,placements,contentVariants,formats:compileVisualFormats(placements)};
  expect(campaign.formats).toHaveLength(5);expect(campaign.formats.find((f:any)=>f.size==='300×250').placementIds).toHaveLength(2);
  const published={...campaign,...publishTemplate(campaign)},compliance=campaignCompliance(published);
  expect(compliance.summary).toEqual({ready:10,warning:0,blocked:0,total:10});
  const build=createCampaignBuildManifest(published);expect(build.state).toBe('ready');expect(build.placements).toHaveLength(10);expect(build.pins).toMatchObject({mediaPlanVersion:1,ttSnapshotVersion:1});
  const outer=readZip(campaignZip(build)),packages=[...outer.entries()].filter(([name])=>name.endsWith('.zip'));
  expect(packages).toHaveLength(10);expect(outer.has('manifest.json')).toBe(true);
  const html=packages.map(([,bytes])=>readZip(bytes).get('index.html')?.toString('utf8')||'').join('\n');
  expect(html).toContain('Осенняя акция');expect(html).toContain('Autumn sale');expect(build.placements.every((p:any)=>p.ttSource==='pilot-media-plan.xlsx / xl/worksheets/sheet1.xml')).toBe(true);expect(build.placements.some((p:any)=>p.impressionUrl.includes('tracker.example.test/google'))).toBe(true);
 });
});
