import http from "node:http";

const PORT=Number(process.env.BANNER_GATEWAY_PORT||8791);
const MODEL=process.env.OPENROUTER_MODEL||"google/gemini-2.5-flash";
const API_KEY=process.env.OPENROUTER_API_KEY||"";
const CONFIGURED_ORIGIN=process.env.BANNER_ALLOWED_ORIGIN||"*";

const requirementProperties={
  maxZipKb:{type:["number","null"]},
  maxDurationSec:{type:["number","null"]},
  clickTag:{type:["boolean","null"]},
  tracking:{type:["boolean","null"]},
  impressionUrl:{type:"string"},
  clickUrl:{type:"string"},
  ttUrl:{type:"string"}
};
const requirementRequired=Object.keys(requirementProperties);

const deliveryPlanSchema={
  name:"delivery_plan",
  strict:true,
  schema:{
    type:"object",additionalProperties:false,
    properties:{
      placements:{type:"array",items:{type:"object",additionalProperties:false,properties:{
        platform:{type:"string"},placement:{type:"string"},size:{type:"string"},width:{type:"number"},height:{type:"number"},creativeType:{type:"string"},ttUrl:{type:"string"},
        requirements:{type:"object",additionalProperties:false,properties:requirementProperties,required:requirementRequired}
      },required:["platform","placement","size","width","height","creativeType","ttUrl","requirements"]}},
      notes:{type:"array",items:{type:"string"}}
    },required:["placements","notes"]
  }
};

const aiTTSchema={
  name:"ai_tt_analysis",
  strict:true,
  schema:{type:"object",additionalProperties:false,properties:{
    matches:{type:"array",items:{type:"object",additionalProperties:false,properties:{
      source:{type:"string"},platform:{type:"string"},placement:{type:"string"},size:{type:"string"},width:{type:"number"},height:{type:"number"},confidence:{type:"number"},evidence:{type:"string"},warnings:{type:"array",items:{type:"string"}},
      requirements:{type:"object",additionalProperties:false,properties:requirementProperties,required:requirementRequired}
    },required:["source","platform","placement","size","width","height","confidence","evidence","warnings","requirements"]}},
    checks:{type:"array",items:{type:"object",additionalProperties:false,properties:{
      index:{type:"number"},status:{type:"string",enum:["ok","conflict","missing","not_found"]},source:{type:"string"},evidence:{type:"string"},issues:{type:"array",items:{type:"string"}},
      suggestedRequirements:{type:"object",additionalProperties:false,properties:requirementProperties,required:requirementRequired}
    },required:["index","status","source","evidence","issues","suggestedRequirements"]}},
    notes:{type:"array",items:{type:"string"}}
  },required:["matches","checks","notes"]}
};

function allowedOrigin(req){const origin=String(req.headers.origin||"");if(CONFIGURED_ORIGIN==="*")return"*";if(!origin||origin==="null")return"null";if(origin===CONFIGURED_ORIGIN||origin==="https://www.figma.com"||origin==="https://figma.com")return origin;return CONFIGURED_ORIGIN;}
function cors(req,res){res.setHeader("access-control-allow-origin",allowedOrigin(req));res.setHeader("vary","Origin");res.setHeader("access-control-allow-methods","POST,OPTIONS,GET");res.setHeader("access-control-allow-headers","content-type");}
function json(req,res,status,payload){cors(req,res);res.writeHead(status,{"content-type":"application/json; charset=utf-8"});res.end(JSON.stringify(payload));}
async function readBody(req){let body="";for await(const chunk of req){body+=chunk;if(body.length>25_000_000)throw new Error("Payload too large");}return body?JSON.parse(body):{};}
function normalizeSize(p){const m=String(p.size||"").match(/(\d{2,4})\s*[x×х]\s*(\d{2,4})/i);const width=Number(p.width)||Number(m?.[1])||0;const height=Number(p.height)||Number(m?.[2])||0;return {...p,width,height,size:width&&height?`${width}×${height}`:String(p.size||"")};}
function emptyRequirements(r={}){return{maxZipKb:r.maxZipKb??null,maxDurationSec:r.maxDurationSec??null,clickTag:r.clickTag??null,tracking:r.tracking??null,impressionUrl:String(r.impressionUrl||""),clickUrl:String(r.clickUrl||""),ttUrl:String(r.ttUrl||"")};}

async function askOpenRouter({messages,schema,title}){if(!API_KEY)throw new Error("OPENROUTER_API_KEY is not configured on the server");const response=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${API_KEY}`,"Content-Type":"application/json","HTTP-Referer":"https://banners.rechord.online","X-Title":title},body:JSON.stringify({model:MODEL,messages,response_format:{type:"json_schema",json_schema:schema},temperature:0})});if(!response.ok)throw new Error(`OpenRouter ${response.status}: ${await response.text()}`);const data=await response.json();const raw=data?.choices?.[0]?.message?.content;if(!raw)throw new Error("OpenRouter returned no content");return typeof raw==="string"?JSON.parse(raw):raw;}

async function extract(input){const content=[{type:"text",text:`Extract banner media-plan placements and technical requirements. Do not invent missing rules. Normalize dimensions as WIDTH×HEIGHT. Source: ${input.filename||"notes"}\n\n${input.text||""}`}];if(input.dataUrl&&/^data:application\/pdf;base64,/i.test(input.dataUrl))content.push({type:"file",file:{filename:input.filename||"requirements.pdf",file_data:input.dataUrl}});const parsed=await askOpenRouter({messages:[{role:"system",content:"You extract advertising media plans and technical requirements into strict structured data. Preserve uncertainty by leaving fields empty/null rather than guessing."},{role:"user",content}],schema:deliveryPlanSchema,title:"Banner Campaign Delivery Plan"});return{...parsed,placements:(parsed.placements||[]).map(p=>({...normalizeSize(p),requirements:emptyRequirements(p.requirements)})),model:MODEL};}

function buildTTContent(input){const content=[{type:"text",text:`Task: ${input.mode==="verify"?"verify campaign placements against attached TT sources":"find the best matching TT for the target"}. Never invent missing requirements. Prefer exact platform + exact dimensions + exact placement. A same-size rule from another platform is NOT a match. Return concise evidence copied/paraphrased from source content and confidence 0..1.\nTarget: ${JSON.stringify(input.target||{})}\nPlacements to verify: ${JSON.stringify(input.placements||[])}`}];for(const doc of input.documents||[]){if(doc.text)content.push({type:"text",text:`\n--- SOURCE ${doc.name||"document"} ---\n${String(doc.text).slice(0,120000)}`});if(doc.dataUrl&&/^data:application\/pdf;base64,/i.test(doc.dataUrl))content.push({type:"file",file:{filename:doc.name||"requirements.pdf",file_data:doc.dataUrl}});}return content;}
async function analyzeTT(input){if(!Array.isArray(input.documents)||!input.documents.length)throw new Error("Attach at least one TT source");const parsed=await askOpenRouter({messages:[{role:"system",content:"You are a production advertising technical-requirements analyst. Match banner requirements only to evidence from provided files. If evidence is absent, return null/empty fields and warnings. For verification, compare each placement with the best source rule and flag contradictions or missing fields. Never silently broaden one publisher's rules to another publisher."},{role:"user",content:buildTTContent(input)}],schema:aiTTSchema,title:"Banner Campaign AI TT Assistant"});return{...parsed,matches:(parsed.matches||[]).map(m=>({...normalizeSize(m),requirements:emptyRequirements(m.requirements)})),checks:(parsed.checks||[]).map(c=>({...c,suggestedRequirements:emptyRequirements(c.suggestedRequirements)})),model:MODEL};}

export const server=http.createServer(async(req,res)=>{try{if(req.method==="OPTIONS"){cors(req,res);res.writeHead(204);return res.end();}if(req.method==="GET"&&req.url==="/healthz")return json(req,res,200,{ok:true,service:"banner-openrouter-gateway",model:MODEL,keyConfigured:Boolean(API_KEY),aiTT:true});if(req.method==="POST"&&req.url==="/api/delivery-plan/extract")return json(req,res,200,await extract(await readBody(req)));if(req.method==="POST"&&req.url==="/api/tt/analyze")return json(req,res,200,await analyzeTT(await readBody(req)));return json(req,res,404,{error:"Not found"});}catch(error){return json(req,res,500,{error:error instanceof Error?error.message:String(error)});}});

server.listen(PORT,"127.0.0.1",()=>console.log(`Banner OpenRouter gateway listening on 127.0.0.1:${PORT}`));
