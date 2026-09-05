import {useMemo,useRef,useState} from "react";
import {AlertTriangle,ArrowRight,CheckCircle2,ChevronDown,FileSpreadsheet,Globe2,Grid2X2,Languages,LayoutDashboard,Link2,LogOut,Pause,Play,Plus,RefreshCcw,Settings,ShieldCheck,Upload,Users2} from "lucide-react";
import CreativeEditor from "../core/EditorCoreV2";
import {processDeliveryInput} from "../campaign/deliveryPlan";
import {campaignReadiness,can,compileVisualFormats,type AccessRole,type Campaign,type Placement,type VisualFormat} from "./domain";
import {t,type Locale} from "./i18n";

type Screen="campaigns"|"overview"|"media"|"delivery"|"library";
type WallMode="creative"|"delivery";
type Session={email:string;role:AccessRole};

const initialPlacements:Placement[]=[
 {id:"pl-yandex-240",platform:"Yandex",placement:"Homepage",width:240,height:400,requirements:{maxZipKb:150,maxDurationSec:15,clickTag:true,tracking:true,sourceLabel:"Verified TT Knowledge",checkedAt:"2026-09-05"}},
 {id:"pl-adriver-300",platform:"AdRiver",placement:"ROS",width:300,height:250,requirements:{maxZipKb:150,maxDurationSec:15,clickTag:true,tracking:true,sourceLabel:"Verified TT Knowledge",checkedAt:"2026-09-05"}},
 {id:"pl-yandex-300",platform:"Yandex",placement:"ROS",width:300,height:250,requirements:{maxZipKb:150,maxDurationSec:15,clickTag:true,tracking:true,sourceLabel:"Verified TT Knowledge",checkedAt:"2026-09-05"}},
 {id:"pl-mail-300",platform:"Mail.ru",placement:"Homepage",width:300,height:250,requirements:{sourceLabel:"Unknown — official source required"}},
 {id:"pl-yandex-728",platform:"Yandex",placement:"Top",width:728,height:90,requirements:{maxZipKb:150,maxDurationSec:15,clickTag:true,tracking:true,sourceLabel:"Verified TT Knowledge",checkedAt:"2026-09-05"}},
 {id:"pl-mobile-320",platform:"Yandex",placement:"Mobile",width:320,height:100,requirements:{maxZipKb:150,maxDurationSec:15,clickTag:true,tracking:true,sourceLabel:"Verified TT Knowledge",checkedAt:"2026-09-05"}},
];
const seededFormats=compileVisualFormats(initialPlacements).map((f,i)=>({...f,creativeState:i===4?"draft":"published" as const,creativeVersion:i===4?0:3}));
const initialCampaign:Campaign={id:"cmp-demo",name:"Summer Product Launch",status:"creative",placements:initialPlacements,formats:seededFormats,locale:"en"};

function useLocalSession(){
 const [session,setSession]=useState<Session|null>(()=>{try{return JSON.parse(localStorage.getItem("bannermatic:preview-session")||"null")}catch{return null}});
 const signIn=(email:string)=>{const next={email,role:"owner" as AccessRole};localStorage.setItem("bannermatic:preview-session",JSON.stringify(next));setSession(next)};
 const signOut=()=>{localStorage.removeItem("bannermatic:preview-session");setSession(null)};
 return{session,signIn,signOut};
}

function SignIn({onEnter}:{onEnter:(email:string)=>void}){
 const [email,setEmail]=useState("owner@bannermatic.app");
 return <main className="bm-auth"><div className="bm-auth-glow"/><section className="bm-auth-card"><div className="bm-logo large">B</div><span className="bm-eyebrow">BANNERMATIC CLOUD</span><h1>Compile campaigns, not banner folders.</h1><p>Media plan → TT Intelligence → Creative Adaptation → Live Compliance → Delivery.</p><label><span>Work email</span><input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@agency.com"/></label><button className="bm-primary bm-wide" disabled={!email.includes("@")||email.length<5} onClick={()=>onEnter(email)}>Enter preview workspace <ArrowRight size={16}/></button><small>Preview access shell. Production authentication is tracked separately in the MVP2 checklist.</small></section></main>
}

function statusClass(value:string){return`bm-status bm-${value}`}
function fmtLabel(f:VisualFormat){return`${f.width}×${f.height}`}

export default function CloudApp(){
 const {session,signIn,signOut}=useLocalSession();
 const [locale,setLocale]=useState<Locale>(()=>(localStorage.getItem("bannermatic:locale") as Locale)||"en");
 const [screen,setScreen]=useState<Screen>("overview");
 const [campaign,setCampaign]=useState<Campaign>(initialCampaign);
 const [wallMode,setWallMode]=useState<WallMode>("creative");
 const [playing,setPlaying]=useState(false);
 const [playKey,setPlayKey]=useState(0);
 const [showEditor,setShowEditor]=useState(false);
 const [importing,setImporting]=useState(false);
 const [importMessage,setImportMessage]=useState("");
 const [newName,setNewName]=useState("");
 const [campaigns,setCampaigns]=useState([{id:"cmp-demo",name:"Summer Product Launch",status:"Creative in progress",updated:"Just now"},{id:"cmp-02",name:"Autumn Retail Push",status:"Media plan ready",updated:"2h ago"}]);
 const mediaInput=useRef<HTMLInputElement>(null);
 const read=campaignReadiness(campaign);
 const visibleFormats=campaign.formats;
 const role=session?.role||"viewer";
 const setLang=(l:Locale)=>{localStorage.setItem("bannermatic:locale",l);setLocale(l)};
 const openEditor=()=>{if(can(role,"edit-creative"))setShowEditor(true)};
 const importPlan=async(files:FileList|null)=>{if(!files?.length)return;setImporting(true);try{const plan=await processDeliveryInput(Array.from(files));const placements:Placement[]=plan.placements.map(p=>({id:p.id,platform:p.platform,placement:p.source,width:p.width,height:p.height,creativeType:p.creativeType,requirements:{...p.requirements,sourceUrl:p.ttUrl,sourceLabel:p.ttUrl?"Imported TT link":"Imported media plan"}}));const mergedFormats=compileVisualFormats(placements,campaign.formats);setCampaign(c=>({...c,placements,formats:mergedFormats,status:"media-ready"}));setImportMessage(`${placements.length} placements → ${mergedFormats.length} unique creatives${plan.needsAi?` · ${plan.needsAi} source(s) need AI extraction`:""}`);setScreen("overview")}finally{setImporting(false);if(mediaInput.current)mediaInput.current.value=""}};
 const createCampaign=()=>{const name=newName.trim();if(!name)return;const id=`cmp-${Date.now()}`;setCampaigns(list=>[{id,name,status:"Draft",updated:"Now"},...list]);setCampaign({id,name,status:"draft",placements:[],formats:[],locale});setNewName("");setScreen("overview")};
 const publishDrafts=()=>setCampaign(c=>({...c,formats:c.formats.map(f=>f.creativeState==="draft"?{...f,creativeState:"published",creativeVersion:Math.max(1,f.creativeVersion+1)}:f)}));
 const placementFor=(id:string)=>campaign.placements.find(p=>p.id===id);
 const campaignTitle=campaign.name;
 if(!session)return <SignIn onEnter={signIn}/>;
 if(showEditor)return <div className="bm-editor-shell"><div className="bm-editor-return"><button onClick={()=>setShowEditor(false)}>← Back to Cloud</button><span>{campaignTitle} · Creative Workspace</span><strong>Cloud sync: preview contract</strong></div><CreativeEditor/></div>;
 return <div className="bm-app">
  <aside className="bm-sidebar">
   <div className="bm-brand"><div className="bm-logo">B</div><div><b>Bannermatic</b><span>Campaign Compiler</span></div></div>
   <div className="bm-workspace"><span>{t(locale,"workspace")}</span><button><i>AC</i><b>Agency Cloud</b><ChevronDown size={14}/></button></div>
   <nav className="bm-nav">
    <button onClick={()=>setScreen("campaigns")} className={screen==="campaigns"?"active":""}><Grid2X2 size={17}/>{t(locale,"campaigns")}</button>
    <span>CAMPAIGN</span>
    <button onClick={()=>setScreen("overview")} className={screen==="overview"?"active":""}><LayoutDashboard size={17}/>{t(locale,"overview")}</button>
    <button onClick={()=>setScreen("media")} className={screen==="media"?"active":""}><FileSpreadsheet size={17}/>{t(locale,"media")}</button>
    <button onClick={()=>setScreen("delivery")} className={screen==="delivery"?"active":""}><ShieldCheck size={17}/>{t(locale,"delivery")}</button>
    <button onClick={()=>setScreen("library")} className={screen==="library"?"active":""}><Link2 size={17}/>{t(locale,"library")}</button>
   </nav>
   <div className="bm-sidebar-foot"><button><Settings size={16}/> Settings</button><button onClick={signOut}><LogOut size={16}/> Sign out</button></div>
  </aside>
  <main className="bm-main">
   <header className="bm-topbar"><div><span className="bm-eyebrow">CAMPAIGN</span><h2>{campaignTitle}</h2></div><div className="bm-top-actions"><div className="bm-locale"><Languages size={15}/><button className={locale==="en"?"on":""} onClick={()=>setLang("en")}>EN</button><button className={locale==="ru"?"on":""} onClick={()=>setLang("ru")}>RU</button></div><span className="bm-role"><Users2 size={15}/>{role}</span><button className="bm-secondary" onClick={openEditor} disabled={!can(role,"edit-creative")}>{t(locale,"openFigma")}</button></div></header>

   {screen==="campaigns"&&<section className="bm-page"><div className="bm-page-head"><div><span className="bm-eyebrow">WORKSPACE</span><h1>{t(locale,"campaigns")}</h1><p>Campaigns are the primary unit of production, not folders of exported files.</p></div><div className="bm-create-inline"><input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Campaign name"/><button className="bm-primary" onClick={createCampaign}><Plus size={15}/>{t(locale,"newCampaign")}</button></div></div><div className="bm-campaign-grid">{campaigns.map(c=><button key={c.id} className="bm-campaign-card" onClick={()=>{if(c.id==="cmp-demo")setCampaign(initialCampaign);else setCampaign({id:c.id,name:c.name,status:"draft",placements:[],formats:[],locale});setScreen("overview")}}><span>{c.status}</span><h3>{c.name}</h3><p>Updated {c.updated}</p><div><b>Open campaign</b><ArrowRight size={15}/></div></button>)}</div></section>}

   {screen==="overview"&&<section className="bm-page">
    <div className="bm-page-head"><div><span className="bm-eyebrow">{t(locale,"campaignWall")}</span><h1>{campaignTitle}</h1><p>{t(locale,"subtitle")}</p></div><button className="bm-primary" onClick={()=>mediaInput.current?.click()} disabled={importing}><Upload size={15}/>{importing?"Processing…":t(locale,"upload")}</button><input ref={mediaInput} hidden type="file" multiple accept=".xlsx,.csv,.tsv,.txt,.docx,.pdf" onChange={e=>importPlan(e.target.files)}/></div>
    {importMessage&&<div className="bm-notice"><CheckCircle2 size={16}/><span>{importMessage}</span></div>}
    <div className="bm-metrics"><article><span>{read.total}</span><p>{t(locale,"placements")}</p></article><article><span>{visibleFormats.length}</span><p>{t(locale,"unique")}</p></article><article><span>{read.ready}/{read.total}</span><p>{t(locale,"ready")}</p></article><article className={read.unknown?"warn":""}><span>{read.unknown}</span><p>{t(locale,"unknown")}</p></article></div>
    <div className="bm-wall-toolbar"><div className="bm-segment"><button className={wallMode==="creative"?"active":""} onClick={()=>setWallMode("creative")}>{t(locale,"creativeView")}</button><button className={wallMode==="delivery"?"active":""} onClick={()=>setWallMode("delivery")}>{t(locale,"deliveryView")}</button></div><div className="bm-play-controls"><button onClick={()=>setPlaying(v=>!v)}>{playing?<Pause size={14}/>:<Play size={14}/>} {playing?t(locale,"pauseAll"):t(locale,"playAll")}</button><button onClick={()=>{setPlayKey(v=>v+1);setPlaying(true)}}><RefreshCcw size={14}/>{t(locale,"replay")}</button></div></div>
    {!visibleFormats.length?<div className="bm-empty"><FileSpreadsheet size={28}/><h3>No creative set yet</h3><p>Attach a media plan or create formats manually. Campaign Compiler will deduplicate placements into required visual formats.</p><button className="bm-primary" onClick={()=>mediaInput.current?.click()}>{t(locale,"upload")}</button></div>:<div className="bm-wall">{visibleFormats.map(f=>{const ps=f.placementIds.map(placementFor).filter(Boolean) as Placement[];const states=ps.map(p=>campaignReadiness({...campaign,placements:[p],formats:[f]}));const ready=states.filter(x=>x.ready===1).length;return <article className="bm-creative-card" key={`${f.id}-${playKey}`}><div className="bm-card-head"><div><b>{fmtLabel(f)}</b><span>{ps.length} placement{ps.length===1?"":"s"}</span></div><span className={statusClass(f.creativeState==="published"?"ready":f.creativeState==="draft"?"warning":"blocked")}>{f.creativeState}</span></div><button className={`bm-preview ${playing?"playing":""}`} style={{aspectRatio:`${f.width}/${f.height}`}} onClick={openEditor}><i/><div className="bm-preview-copy"><strong>BANNERMATIC</strong><b>One campaign.<br/>Every placement.</b><span>Compile → adapt → deliver</span></div></button><div className="bm-card-meta">{wallMode==="creative"?<><div><span>Creative version</span><b>v{f.creativeVersion}</b></div><div><span>Cloud state</span><b>{f.creativeState}</b></div><button onClick={openEditor} disabled={!can(role,"edit-creative")}>{t(locale,"openFigma")} <ArrowRight size={13}/></button></>:<><div className="bm-placement-list">{ps.map(p=>{const known=Boolean(p.requirements.sourceUrl||p.requirements.sourceLabel&&!p.requirements.sourceLabel.startsWith("Unknown"));return <div key={p.id}><span><b>{p.platform}</b><small>{p.placement}</small></span><em className={statusClass(f.creativeState==="missing"?"blocked":known?"ready":"unknown")}>{known?"TT ✓":"TT ?"}</em></div>})}</div><div className="bm-delivery-summary"><b>{ready}/{ps.length}</b><span>placements ready</span></div></>}</div></article>})}</div>}
    {!!campaign.formats.some(f=>f.creativeState==="draft")&&<div className="bm-publish"><div><span className="bm-eyebrow">CREATIVE SYNC</span><b>Draft creative changes are waiting to be published</b><p>Publishing creates a new creative version. Media plan and TT state stay untouched.</p></div><button className="bm-primary" onClick={publishDrafts} disabled={!can(role,"edit-creative")}>Publish Creative</button></div>}
   </section>}

   {screen==="media"&&<section className="bm-page"><div className="bm-page-head"><div><span className="bm-eyebrow">CAMPAIGN COMPILER</span><h1>{t(locale,"media")}</h1><p>The media plan is normalized into placements first, then deduplicated into visual formats.</p></div><button className="bm-primary" onClick={()=>mediaInput.current?.click()}><Upload size={15}/>{t(locale,"upload")}</button></div><div className="bm-table"><div className="bm-table-head"><span>Platform</span><span>Placement</span><span>Format</span><span>TT source</span><span>Creative</span></div>{campaign.placements.map(p=>{const f=campaign.formats.find(x=>x.placementIds.includes(p.id));return <div className="bm-table-row" key={p.id}><span><b>{p.platform}</b></span><span>{p.placement}</span><span>{p.width}×{p.height}</span><span>{p.requirements.sourceLabel||"Unknown"}</span><span className={statusClass(f?.creativeState==="published"?"ready":f?.creativeState==="draft"?"warning":"blocked")}>{f?.creativeState||"missing"}</span></div>})}</div></section>}

   {screen==="delivery"&&<section className="bm-page"><div className="bm-page-head"><div><span className="bm-eyebrow">LIVE COMPLIANCE FOUNDATION</span><h1>{t(locale,"delivery")}</h1><p>Placement requirements are owned by Cloud. Creative changes are resolved in the Creative Workspace.</p></div></div><div className="bm-compliance-list">{campaign.placements.map(p=>{const f=campaign.formats.find(x=>x.placementIds.includes(p.id));const known=Boolean(p.requirements.sourceLabel&&!p.requirements.sourceLabel.startsWith("Unknown"));return <article key={p.id}><div><b>{p.platform} · {p.placement}</b><span>{p.width}×{p.height}</span></div><div><span>ZIP</span><b>{p.requirements.maxZipKb?`≤ ${p.requirements.maxZipKb} KB`:"Unknown"}</b></div><div><span>Duration</span><b>{p.requirements.maxDurationSec?`≤ ${p.requirements.maxDurationSec}s`:"Unknown"}</b></div><div><span>Creative</span><b>{f?.creativeState||"missing"}</b></div><em className={statusClass(!f||f.creativeState==="missing"?"blocked":known?"ready":"unknown")}>{!f||f.creativeState==="missing"?"Blocked":known?"Ready":"TT unknown"}</em></article>})}</div></section>}

   {screen==="library"&&<section className="bm-page"><div className="bm-page-head"><div><span className="bm-eyebrow">KNOWLEDGE LAYER</span><h1>{t(locale,"library")}</h1><p>Verified official requirements, client overrides and provenance belong to Cloud.</p></div></div><div className="bm-library-grid">{["Yandex Direct","Adfox","AdRiver","Habr","hh.ru"].map((name,i)=><article key={name}><div><Globe2 size={17}/><b>{name}</b></div><span className={statusClass("ready")}>Verified</span><p>Official source · checked Sep 2026</p><small>{i%2?"Placement-specific requirements":"HTML5 · formats · tracking rules"}</small></article>)}</div></section>}
  </main>
 </div>;
}
