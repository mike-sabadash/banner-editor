import {useEffect,useMemo,useRef,useState} from "react";
import {api} from "../mvp2/api";
import type {Campaign} from "../mvp2/domain";
import {ttForFormat,validateScenesForTT} from "./campaignBridge";
import {DEFAULT_SCENES,generateScene,type Scene} from "./sceneModel";
import {mergedDisplayFormats} from "./editorControls";
import {registerCampaignFonts} from "./campaignFonts";
import "./sceneEditor.css";
import "./editorProductV2.css";

export default function CampaignPreview(){
 const campaignId=new URLSearchParams(location.search).get("campaignId")||"";
 const [campaign,setCampaign]=useState<Campaign|null>(null);const [error,setError]=useState("");const [clock,setClock]=useState(0);const restartAt=useRef(performance.now());
 useEffect(()=>{if(!campaignId){setError("Campaign id is missing");return}let alive=true;void api.campaign(campaignId).then(async c=>{await registerCampaignFonts(c.creativeDocument?.fonts||[]);if(alive)setCampaign(c)}).catch(e=>alive&&setError(e instanceof Error?e.message:String(e)));return()=>{alive=false}},[campaignId]);
 useEffect(()=>{let raf=0;const tick=(now:number)=>{setClock(now-restartAt.current);raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf)},[]);
 const scenes=((campaign?.creativeDocument?.scenes as Scene[]|undefined)?.length?campaign!.creativeDocument!.scenes as Scene[]:DEFAULT_SCENES);
 const formats=useMemo(()=>mergedDisplayFormats(campaign||undefined),[campaign]);const total=scenes.reduce((n,s)=>n+s.durationMs,0)||1;let local=clock%total,active=scenes[0];for(const s of scenes){if(local<s.durationMs){active=s;break}local-=s.durationMs}
 const restart=()=>{restartAt.current=performance.now();setClock(0)};
 if(error)return <main className="bm-campaign-wall"><h2>Could not open preview</h2><p>{error}</p></main>;if(!campaign)return <main className="bm-campaign-wall">Loading campaign preview…</main>;
 return <main className="bm-campaign-wall"><header><div><b>{campaign.name}</b><div>Campaign preview · {formats.length} formats · Scene {scenes.indexOf(active)+1}/{scenes.length} · looping</div></div><div><button onClick={()=>{location.href=`/?view=scene-editor&campaignId=${encodeURIComponent(campaign.id)}`}}>← Back to editor</button> <button onClick={restart}>Restart all</button></div></header><section className="bm-campaign-wall-grid">{formats.map(format=>{const out=generateScene(active,format),tt=ttForFormat(campaign,format.id),check=validateScenesForTT(scenes,tt);return <article className="bm-campaign-card" key={`${format.width}x${format.height}`}><h3>{format.label}</h3><small>{format.width} × {format.height} · TT {check.status}</small><div className="bm-campaign-card-stage"><div style={{aspectRatio:`${format.width}/${format.height}`}}>{out.layers.filter(l=>l.visible&&local>=l.startMs&&local<=l.endMs).map(l=><div key={`${active.id}-${l.id}`} className={`bm-preview-object motion-${l.motion} is-playing`} style={{position:"absolute",left:`${l.box.x}%`,top:`${l.box.y}%`,width:`${l.box.w}%`,height:`${l.box.h}%`,background:l.kind==="shape"?l.color:undefined,color:l.color,fontFamily:l.fontFamily||"Inter",fontWeight:l.fontWeight,fontSize:l.fontSize,overflow:l.kind==="image"?"hidden":undefined,"--mx":`${l.motionVector.x}%`,"--my":`${l.motionVector.y}%`,"--motion-duration":`${l.motionDurationMs}ms`,animationTimingFunction:l.easing} as React.CSSProperties}>{l.kind==="image"&&l.assetUrl?<img src={l.assetUrl} alt="" style={{width:"100%",height:"100%",objectFit:l.fit||"contain",transformOrigin:"center",transform:`translate(${l.crop?.x||0}%,${l.crop?.y||0}%) scale(${l.crop?.scale||1})`}}/>:l.kind==="text"?<span>{l.text}</span>:null}</div>)}</div></div></article>})}</section></main>
}
