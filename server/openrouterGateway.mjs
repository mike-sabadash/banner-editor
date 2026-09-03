import http from "node:http";

const PORT=Number(process.env.BANNER_GATEWAY_PORT||8791);
const MODEL=process.env.OPENROUTER_MODEL||"google/gemini-2.5-flash";
const API_KEY=process.env.OPENROUTER_API_KEY||"";
const ORIGIN=process.env.BANNER_ALLOWED_ORIGIN||"*";

const schema={
  name:"delivery_plan",
  strict:true,
  schema:{
    type:"object",
    additionalProperties:false,
    properties:{
      placements:{
        type:"array",
        items:{
          type:"object",
          additionalProperties:false,
          properties:{
            platform:{type:"string"},
            size:{type:"string"},
            width:{type:"number"},
            height:{type:"number"},
            creativeType:{type:"string"},
            ttUrl:{type:"string"},
            requirements:{
              type:"object",
              additionalProperties:false,
              properties:{
                maxZipKb:{type:["number","null"]},
                maxDurationSec:{type:["number","null"]},
                clickTag:{type:["boolean","null"]},
                tracking:{type:["boolean","null"]}
              },
              required:["maxZipKb","maxDurationSec","clickTag","tracking"]
            }
          },
          required:["platform","size","width","height","creativeType","ttUrl","requirements"]
        }
      },
      notes:{type:"array",items:{type:"string"}}
    },
    required:["placements","notes"]
  }
};

function cors(res){res.setHeader("access-control-allow-origin",ORIGIN);res.setHeader("access-control-allow-methods","POST,OPTIONS,GET");res.setHeader("access-control-allow-headers","content-type");}
function json(res,status,payload){cors(res);res.writeHead(status,{"content-type":"application/json; charset=utf-8"});res.end(JSON.stringify(payload));}
async function readBody(req){let body="";for await(const chunk of req){body+=chunk;if(body.length>20_000_000)throw new Error("Payload too large");}return body?JSON.parse(body):{};}
function normalizeSize(p){const width=Number(p.width)||Number(String(p.size||"").match(/(\d{2,4})\s*[x×х]\s*(\d{2,4})/i)?.[1])||0;const height=Number(p.height)||Number(String(p.size||"").match(/(\d{2,4})\s*[x×х]\s*(\d{2,4})/i)?.[2])||0;return {...p,width,height,size:width&&height?`${width}×${height}`:String(p.size||"")};}
async function extract(input){if(!API_KEY)throw new Error("OPENROUTER_API_KEY is not configured on the server");
  const content=[{type:"text",text:`Extract banner media-plan placements and technical requirements. Do not invent missing rules. Normalize dimensions as WIDTH×HEIGHT. Source: ${input.filename||"notes"}\n\n${input.text||""}`}];
  if(input.dataUrl&&/^data:application\/pdf;base64,/i.test(input.dataUrl))content.push({type:"file",file:{filename:input.filename||"requirements.pdf",file_data:input.dataUrl}});
  const response=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${API_KEY}`,"Content-Type":"application/json","HTTP-Referer":"https://banners.rechord.online","X-Title":"Banner Campaign Delivery Plan"},body:JSON.stringify({model:MODEL,messages:[{role:"system",content:"You extract advertising media plans and technical requirements into strict structured data. Preserve uncertainty by leaving fields empty/null rather than guessing."},{role:"user",content}],response_format:{type:"json_schema",json_schema:schema},temperature:0})});
  if(!response.ok)throw new Error(`OpenRouter ${response.status}: ${await response.text()}`);
  const data=await response.json();const raw=data?.choices?.[0]?.message?.content;if(!raw)throw new Error("OpenRouter returned no content");const parsed=typeof raw==="string"?JSON.parse(raw):raw;return {...parsed,placements:(parsed.placements||[]).map(normalizeSize),model:MODEL};
}

export const server=http.createServer(async(req,res)=>{try{if(req.method==="OPTIONS"){cors(res);res.writeHead(204);return res.end();}if(req.method==="GET"&&req.url==="/healthz")return json(res,200,{ok:true,service:"banner-openrouter-gateway",model:MODEL,keyConfigured:Boolean(API_KEY)});if(req.method==="POST"&&req.url==="/api/delivery-plan/extract")return json(res,200,await extract(await readBody(req)));return json(res,404,{error:"Not found"});}catch(error){return json(res,500,{error:error instanceof Error?error.message:String(error)});}});

server.listen(PORT,"127.0.0.1",()=>console.log(`Banner OpenRouter gateway listening on 127.0.0.1:${PORT}`));
