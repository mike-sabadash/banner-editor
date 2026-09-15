import {useEffect,useMemo,useState} from "react";
import {api} from "../mvp2/api";
import type {Campaign} from "../mvp2/domain";
import {formatsFromCampaign,ttForFormat,validateScenesForTT} from "./campaignBridge";
import {DEFAULT_SCENES,RU_CORE_10,generateScene,type OutputFormat,type Scene} from "./sceneModel";
import "./editorProductV2.css";

const mergeFormats=(campaign:Campaign)=>{const linked=formatsFromCampaign(campaign);const map=new Map<string,OutputFormat>();for(const f of [...RU_CORE_10,...linked])map.set(`${f.width}x${f.height}`,f);return [...map.values()]};
export default function CampaignPreview(){
 const campaignId=new URLSearchParams(location.search).get("campaignId")||"";
 const [campaign,setCampaign]=useState<Campaign|null>(null);const [error,setError]=useState("");const [clock,setClock]=useState(0);
 useEffect(()=>{if(!campaignId){setError("Campaign id is missing");return}let alive=true;void api.campaign(campaignId).then(c=>alive&&setCampaign(c)).catch(e=>alive&&setError(e instanceof Error?e.message:String(e)));return()=>{alive=false}},[campaignId]);
 useEffect(()=>{let raf=0,start=performance.now();const tick=(now:number)=>{setClock(now-start);raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf)},[]);
 const scenes=((campaign?.creativeDocument?.scenes as Scene[]|undefined)?.length?campaign!.creativeDocument!.scenes as Scene[]:DEFAULT_SCENES);
 const formats=useMemo(()=>campaign?mergeFormats(campaign):[],[campaign]);const total=scenes.reduce((n,s)=>n+s.durationMs,0)||1;let local=clock%total,active=scenes[0];for(const s of scenes){if(local<s.durationMs){active=s;break}local-=s.durationMs}
 if(error)return <main className="bm-campaign-wall"><h2>Could not open preview</h2><p>{error}</p></main>;if(!campaign)return <main className="bm-campaign-wall">Loading campaign preview…</main>;
 return <main className="bm-campaign-wall"><header><div><b>{campaign.name}</b><div>Campaign preview · {formats.length} formats · looping all scenes</div></div><div><button onClick={()=>{location.href=`/?view=scene-editor&campaignId=${encodeURIComponent(campaign.id)}`}}>← Back to editor</button> <button onClick={()=>setClock(0)}>Restart all</button></div></header><section className="bm-campaign-wall-grid">{formats.map(format=>{const out=generateScene(active,format),tt=ttForFormat(campaign,format.id),check=validateScenesForTT(scenes,tt);return <article className="bm-campaign-card" key={format.id}><h3>{format.label}</h3><small>{format.width} × {format.height} · TT {check.status}</small><div className="bm-campaign-card-stage"><div style={{aspectRatio:`${format.width}/${format.height}`}}>{out.layers.filter(l=>local>=l.startMs&&local<=l.endMs).map(l=><div key={l.id} style={{position:"absolute",left:`${l.box.x}%`,top:`${l.box.y}%`,width:`${l.box.w}%`,height:`${l.box.h}%`,background:l.kind==="shape"?l.color:undefined,color:l.color,fontFamily:l.fontFamily||"Inter",fontWeight:l.fontWeight,fontSize:l.fontSize,overflow:l.kind==="image"?"hidden":undefined}}>{l.kind==="image"&&l.assetUrl?<img src={l.assetUrl} style={{width:"100%",height:"100%",objectFit:l.fit||"contain",transform:`translate(${l.crop?.x||0}%,${l.crop?.y||0}%) scale(${l.crop?.scale||1})`}}/>:l.kind==="text"?l.text:null}</div>)}</div></div></article>})}</section></main>
}
