export type DeliverySourceKind="spreadsheet"|"document"|"link"|"text";
export type DeliverySourceStatus="parsed"|"needs-ai"|"error";
export type DeliverySource={id:string;name:string;kind:DeliverySourceKind,status:DeliverySourceStatus,detail:string};
export type DeliveryRequirement={maxZipKb?:number,maxDurationSec?:number,clickTag?:boolean,tracking?:boolean,clickUrl?:string,impressionUrl?:string,legal?:string};
export type DeliveryPlacement={id:string,platform:string,size:string,width:number,height:number,creativeType:string,ttUrl?:string,requirements:DeliveryRequirement,source:string,row?:number,placement?:string,language?:string,reviewIssues?:string[]};
export type DeliveryPlan={sources:DeliverySource[],placements:DeliveryPlacement[],uniqueFormats:string[],needsAi:number,createdAt:number};

const SIZE_RE=/(\d{2,4})\s*[x×х]\s*(\d{2,4})/gi;
const URL_RE=/https?:\/\/[^\s,;]+/i;
const textDecoder=new TextDecoder();
const clean=(value:string)=>value.replace(/\s+/g," ").trim();
const sizeKey=(w:number,h:number)=>`${w}×${h}`;
const decodeXml=(value:string)=>value.replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(Number.parseInt(n,16))).replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const xmlBlocks=(xml:string,tag:string)=>[...xml.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`,'g'))];
const xmlValue=(xml:string,tag:string)=>{const match=xml.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`));return match?decodeXml(match[1].replace(/<[^>]+>/g,'')):''};

function detectDelimiter(line:string){const options=[",",";","\t"];return options.sort((a,b)=>line.split(b).length-line.split(a).length)[0]}
export function parseDelimited(text:string){
 const delimiter=detectDelimiter(text.replace(/^\uFEFF/,"").split(/\r?\n/)[0]||"");const rows:string[][]=[];let cells:string[]=[],cell="",quoted=false;
 const push=()=>{cells.push(cell.trim());cell=""};
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(c===delimiter&&!quoted)push();else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;push();if(cells.some(Boolean))rows.push(cells);cells=[]}else cell+=c}
 if(quoted)throw new Error('Unclosed quoted field');push();if(cells.some(Boolean))rows.push(cells);return rows;
}

function inferPlatform(text:string){const lower=text.toLowerCase();const known:[[RegExp,string]]|any=[[/google|gdn/,"Google Ads"],[/яндекс|yandex/,"Yandex"],[/adfox/,"AdFox"],[/vk|вконтакте/,"VK"],[/rbc|рбк/,"RBC"]];for(const [pattern,name] of known)if(pattern.test(lower))return name;const first=clean(text.split(/[|,;\t]/)[0]||"");return first&&first.length<40?first:"Unknown platform"}
function inferRequirements(text:string):DeliveryRequirement{const req:DeliveryRequirement={};const weight=text.match(/(\d+(?:[.,]\d+)?)\s*(kb|кб|mb|мб)/i);if(weight){const n=Number(weight[1].replace(",","."));req.maxZipKb=Math.round(n*(/mb|мб/i.test(weight[2])?1024:1))}const duration=text.match(/(?:duration|длительност\w*)[^\d]{0,12}(\d+(?:[.,]\d+)?)\s*(?:s|sec|сек|с\b)/i);if(duration)req.maxDurationSec=Number(duration[1].replace(",","."));if(/clicktag|click\s*tag/i.test(text))req.clickTag=true;if(/tracking|пиксел|pixel/i.test(text))req.tracking=true;return req}
const headerName=(s:string)=>s.toLowerCase().replace(/[^a-zа-яё0-9]/gi,'');
const aliases:Record<string,string[]>={platform:['platform','network','площадка','сеть'],placement:['placement','размещение','позиция'],size:['size','format','размер','формат'],width:['width','ширина'],height:['height','высота'],maxZipKb:['maxzipkb','weightkb','вескб','вес','maxweight'],maxDurationSec:['duration','durationsec','длительность','длительностьсек'],clickTag:['clicktag'],tracking:['tracking','pixel','пиксель'],clickUrl:['clickurl','landingurl','ссылка','ссылкаперехода'],impressionUrl:['impressionurl','pixelurl','пиксельurl'],ttUrl:['tturl','specurl','тт','ссылкатт'],language:['language','язык'],legal:['legal','disclaimer','дисклеймер'],creativeType:['output','type','тип']};
export function placementsFromRows(rows:string[][],source:string){
 const out:DeliveryPlacement[]=[];let mapping:Record<string,number>={};
 rows.forEach((cells,index)=>{
  const candidate:Record<string,number>={};for(const [field,names] of Object.entries(aliases)){const i=cells.findIndex(c=>names.includes(headerName(c||'')));if(i>=0)candidate[field]=i}
  if((candidate.size!==undefined||candidate.width!==undefined)&&Object.keys(candidate).length>=2){mapping=candidate;return}
  const value=(field:string)=>String(cells[mapping[field]]||'').trim();const joined=clean(cells.join(' | '));
  let sizes=[...value('size').matchAll(SIZE_RE)].map(m=>[Number(m[1]),Number(m[2])]);
  if(value('width')&&value('height'))sizes=[[Number(value('width')),Number(value('height'))]];
  const issues:string[]=[];if(!Object.keys(mapping).length){sizes=[...joined.matchAll(SIZE_RE)].map(m=>[Number(m[1]),Number(m[2])]);if(sizes.length)issues.push('Column mapping was not recognized. Review inferred fields.');}
  if(!sizes.length){if(value('platform')||value('placement')){sizes=[[0,0]];issues.push('Missing or unrecognized dimensions.')}else return}
  const requirements:DeliveryRequirement=Object.keys(mapping).length?{}:inferRequirements(joined);
  for(const field of ['maxZipKb','maxDurationSec'] as const){const raw=value(field);if(!raw)continue;const n=Number(raw.replace(',','.').replace(/\s*(kb|кб|s|sec|сек)$/i,''));if(Number.isFinite(n)&&n>0)requirements[field]=n;else issues.push(`Review ${field}: ${raw}`)}
  for(const field of ['clickTag','tracking'] as const){const raw=value(field).toLowerCase();if(!raw)continue;if(['true','yes','да','required','1'].includes(raw))requirements[field]=true;else if(['false','no','нет','not required','0'].includes(raw))requirements[field]=false;else issues.push(`Review ${field}: ${raw}`)}
  for(const field of ['clickUrl','impressionUrl','legal'] as const)if(value(field))requirements[field]=value(field);
  for(const [width,height] of sizes){if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)issues.push('Dimensions must be positive integer pixels.');out.push({id:`${source}-${index}-${width}x${height}`,platform:value('platform')||inferPlatform(joined),placement:value('placement')||source,size:sizeKey(width,height),width,height,creativeType:value('creativeType')||'HTML5',ttUrl:value('ttUrl')||undefined,requirements,source,row:index+1,language:value('language'),reviewIssues:[...issues]})}
 });return out;
}

function placementsFromText(text:string,source:string){return placementsFromRows(text.split(/\r?\n/).filter(Boolean).map(line=>[line]),source)}

async function inflateRaw(bytes:Uint8Array){const payload=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer;const stream=new Blob([payload]).stream().pipeThrough(new DecompressionStream("deflate-raw" as any));return new Uint8Array(await new Response(stream).arrayBuffer())}
async function unzip(buffer:ArrayBuffer){const data=new Uint8Array(buffer),view=new DataView(buffer);let eocd=-1;for(let i=data.length-22;i>=Math.max(0,data.length-65557);i--){if(view.getUint32(i,true)===0x06054b50){eocd=i;break}}if(eocd<0)throw new Error("ZIP directory not found");const entries=view.getUint16(eocd+10,true),centralOffset=view.getUint32(eocd+16,true);let cursor=centralOffset;const files=new Map<string,Uint8Array>();for(let i=0;i<entries;i++){if(view.getUint32(cursor,true)!==0x02014b50)break;const method=view.getUint16(cursor+10,true),compressed=view.getUint32(cursor+20,true),nameLen=view.getUint16(cursor+28,true),extraLen=view.getUint16(cursor+30,true),commentLen=view.getUint16(cursor+32,true),localOffset=view.getUint32(cursor+42,true),name=textDecoder.decode(data.slice(cursor+46,cursor+46+nameLen));const localNameLen=view.getUint16(localOffset+26,true),localExtraLen=view.getUint16(localOffset+28,true),start=localOffset+30+localNameLen+localExtraLen,chunk=data.slice(start,start+compressed);files.set(name,method===0?chunk:method===8?await inflateRaw(chunk):new Uint8Array());cursor+=46+nameLen+extraLen+commentLen}return files}
function sharedStrings(xml?:Uint8Array){if(!xml)return[];const text=textDecoder.decode(xml);return xmlBlocks(text,'si').map(si=>xmlBlocks(si[1],'t').map(t=>decodeXml(t[1].replace(/<[^>]+>/g,''))).join(''))}
function sheetRows(xml:Uint8Array,shared:string[]){const text=textDecoder.decode(xml),rows:string[][]=[];for(const row of xmlBlocks(text,'row')){const cells:string[]=[];for(const cell of xmlBlocks(row[1],'c')){const attrs=cell[0].slice(0,cell[0].indexOf('>')+1),ref=attrs.match(/\br="([^"]+)"/)?.[1]||'A1',letters=ref.match(/[A-Z]+/)?.[0]||'A';let col=0;for(const ch of letters)col=col*26+(ch.charCodeAt(0)-64);const type=attrs.match(/\bt="([^"]+)"/)?.[1],raw=type==='inlineStr'?xmlValue(cell[1],'t'):xmlValue(cell[1],'v');cells[col-1]=type==='s'?shared[Number(raw)]||'':raw}rows.push(cells.map(v=>v||''))}return rows}
export async function parseXlsx(file:File){const zip=await unzip(await file.arrayBuffer()),shared=sharedStrings(zip.get("xl/sharedStrings.xml"));const sheets=[...zip.entries()].filter(([name])=>/^xl\/worksheets\/sheet\d+\.xml$/.test(name)).sort();return sheets.map(([name,xml])=>({name,rows:sheetRows(xml,shared)}))}
async function parseDocx(file:File){const zip=await unzip(await file.arrayBuffer()),xml=zip.get("word/document.xml");if(!xml)return"";return xmlBlocks(textDecoder.decode(xml),'w:t').map(n=>decodeXml(n[1].replace(/<[^>]+>/g,''))).join("\n")}

export async function processDeliveryInput(files:File[],pastedText=""):Promise<DeliveryPlan>{const sources:DeliverySource[]=[],placements:DeliveryPlacement[]=[];for(const file of files){const ext=file.name.split(".").pop()?.toLowerCase()||"";try{if(["csv","tsv","txt"].includes(ext)){const rows=parseDelimited(await file.text());placements.push(...placementsFromRows(rows,file.name));sources.push({id:crypto.randomUUID(),name:file.name,kind:ext==="txt"?"text":"spreadsheet",status:"parsed",detail:`${rows.length} rows scanned`})}else if(ext==="xlsx"){const sheets=await parseXlsx(file);for(const sheet of sheets)placements.push(...placementsFromRows(sheet.rows,`${file.name} / ${sheet.name}`));const rows=sheets.flatMap(s=>s.rows);sources.push({id:crypto.randomUUID(),name:file.name,kind:"spreadsheet",status:"parsed",detail:`${rows.length} spreadsheet rows scanned`})}else if(ext==="docx"){const text=await parseDocx(file);placements.push(...placementsFromText(text,file.name));sources.push({id:crypto.randomUUID(),name:file.name,kind:"document",status:"parsed",detail:"Document text extracted locally"})}else{sources.push({id:crypto.randomUUID(),name:file.name,kind:"document",status:"needs-ai",detail:"Not parsed. Requires supported conversion or explicitly requested AI extraction."})}}catch(error){sources.push({id:crypto.randomUUID(),name:file.name,kind:"document",status:"error",detail:error instanceof Error?error.message:String(error)})}}
 if(clean(pastedText)){placements.push(...placementsFromText(pastedText,"Pasted notes & links"));sources.push({id:crypto.randomUUID(),name:"Pasted notes & links",kind:/https?:\/\//.test(pastedText)?"link":"text",status:"parsed",detail:"Text and links scanned"})}
 return{sources,placements,uniqueFormats:[...new Set(placements.map(p=>p.size))],needsAi:sources.filter(s=>s.status==='needs-ai').length,createdAt:Date.now()}}


export function matchPlanFormats(plan:DeliveryPlan,creativeSizes:string[]){const creative=new Set(creativeSizes.map(s=>s.replace(/\s/g,"").replace(/[xх]/gi,"×")));const matched=plan.uniqueFormats.filter(size=>creative.has(size)),missing=plan.uniqueFormats.filter(size=>!creative.has(size));return{matched,missing,coverage:plan.uniqueFormats.length?Math.round(matched.length/plan.uniqueFormats.length*100):100}}
