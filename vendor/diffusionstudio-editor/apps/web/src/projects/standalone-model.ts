export type StandaloneNode={source:string;tag:string;props:Record<string,unknown>;parent?:string;text?:string};
export type StandaloneBundleModel={version:1;campaignId?:string;nodes:StandaloneNode[]};

const MARKER='/* BANNERMATIC_STANDALONE_MODEL:';
const COMPOSITION_TAGS=new Set([
 'stage','scene','group','rect','video','image','audio','text','textRange','sequence','captions','adjustmentLayer',
 'solidPaint','linearGradientPaint','radialGradientPaint','imagePaint','videoPaint','colorStop','stroke','shadow',
 'effect','animation','keyframeTrack','keyframe','htmlPaint','html','shaderPaint','surfacePaint','surface',
]);
const encodeText=(value:string)=>{const bytes=new TextEncoder().encode(value);let out='';for(let i=0;i<bytes.length;i+=32768)out+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(out)};
const decodeText=(value:string)=>{const raw=atob(value),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return new TextDecoder().decode(bytes)};
const variable=(index:number)=>`bm_node_${index}`;

export function canonicalStandaloneTag(tag:string){
 const candidate=tag.charAt(0).toLowerCase()+tag.slice(1);
 return COMPOSITION_TAGS.has(candidate)?candidate.charAt(0).toUpperCase()+candidate.slice(1):tag;
}

function canonicalizeModel(model:StandaloneBundleModel):StandaloneBundleModel{
 return {...model,nodes:model.nodes.map(node=>({...node,tag:canonicalStandaloneTag(node.tag)}))};
}

export function decodeStandaloneBundle(code:string):StandaloneBundleModel|null{const start=code.indexOf(MARKER);if(start<0)return null;const end=code.indexOf(' */',start);if(end<0)return null;try{return canonicalizeModel(JSON.parse(decodeText(code.slice(start+MARKER.length,end))) as StandaloneBundleModel)}catch{return null}}
export function encodeStandaloneBundle(input:StandaloneBundleModel){const model=canonicalizeModel(input),sourceToVariable=new Map<string,string>(),lines:string[]=[];model.nodes.forEach((node,index)=>{const name=variable(index);sourceToVariable.set(node.source,name);lines.push(` const ${name}=createElement(${JSON.stringify(node.tag)}); spread(${name},${JSON.stringify({__source:node.source,...node.props})});`);if(node.text!==undefined)lines.push(` insertNode(${name},createTextNode(${JSON.stringify(node.text)}));`);if(node.parent)lines.push(` insertNode(${sourceToVariable.get(node.parent)||variable(0)},${name});`)});return`${MARKER}${encodeText(JSON.stringify(model))} */\nconst { createElement, createTextNode, spread, insertNode } = require("@diffusionstudio/jsx");\nfunction Project(){\n${lines.join('\n')}\n return ${variable(0)};\n}\nmodule.exports.default=Project;`}
