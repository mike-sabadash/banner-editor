import {useMemo,useState} from "react";
import {ChevronRight,Eye,EyeOff,Layers3,Play,Plus,Sparkles,Trash2} from "lucide-react";
import {DEFAULT_SCENES,RU_CORE_10,generateScene,type LayerRole,type MotionPreset,type Scene} from "./sceneModel";
import "./sceneEditor.css";

const ROLES:LayerRole[]=["background","hero","logo","headline","copy","cta","legal","graphic"];
const MOTIONS:MotionPreset[]=["none","fade","from-left","from-right","from-top","from-bottom","scale-in"];

export default function WebSceneEditor(){
  const [scenes,setScenes]=useState<Scene[]>(DEFAULT_SCENES);
  const [sceneId,setSceneId]=useState(DEFAULT_SCENES[0].id);
  const [layerId,setLayerId]=useState(DEFAULT_SCENES[0].layers[1].id);
  const [formatId,setFormatId]=useState("300x600");
  const [generated,setGenerated]=useState(false);
  const [playing,setPlaying]=useState(false);
  const scene=scenes.find(s=>s.id===sceneId)??scenes[0];
  const format=RU_CORE_10.find(f=>f.id===formatId)??RU_CORE_10[0];
  const layer=scene.layers.find(l=>l.id===layerId)??scene.layers[0];
  const output=useMemo(()=>generateScene(scene,format),[scene,format]);
  const patchLayer=(patch:Partial<typeof layer>)=>setScenes(all=>all.map(s=>s.id===scene.id?{...s,layers:s.layers.map(l=>l.id===layer.id?{...l,...patch}:l)}:s));
  const addScene=()=>{const n=scenes.length+1;const next:Scene={id:`scene-${Date.now()}`,name:`Scene ${n}`,durationMs:1800,layers:[{id:`bg-${Date.now()}`,name:"Background",role:"background",color:"#111827",motion:"none",durationMs:0,easing:"linear",visible:true},{id:`headline-${Date.now()}`,name:"Headline",role:"headline",text:"Новый экран",color:"#ffffff",motion:"fade",durationMs:350,easing:"ease-out",visible:true}]};setScenes(v=>[...v,next]);setSceneId(next.id);setLayerId(next.layers[1].id)};
  const deleteScene=()=>{if(scenes.length<=1)return;const rest=scenes.filter(s=>s.id!==scene.id);setScenes(rest);setSceneId(rest[0].id);setLayerId(rest[0].layers[0].id)};
  const addLayer=()=>{const id=`layer-${Date.now()}`;setScenes(all=>all.map(s=>s.id===scene.id?{...s,layers:[...s.layers,{id,name:"Graphic",role:"graphic",color:"#f59e0b",motion:"fade",durationMs:350,easing:"ease-out",visible:true}]}:s));setLayerId(id)};
  return <div className="scene-editor-shell">
    <header className="scene-topbar"><div><strong>Bannermatic</strong><span>Scene Responsive Editor</span></div><div className="scene-top-actions"><button onClick={()=>setPlaying(v=>!v)}><Play size={15}/>{playing?"Stop":"Preview"}</button><button className="primary" onClick={()=>setGenerated(true)}><Sparkles size={15}/>Generate 10 formats</button></div></header>
    <main className="scene-workspace">
      <aside className="scene-panel scenes-list"><div className="panel-head"><div><small>CAMPAIGN</small><h3>Scenes</h3></div><button onClick={addScene}><Plus size={14}/></button></div>{scenes.map((s,i)=><button key={s.id} className={`scene-item ${s.id===scene.id?"active":""}`} onClick={()=>{setSceneId(s.id);setLayerId(s.layers[0]?.id||"")}}><span className="scene-index">{String(i+1).padStart(2,"0")}</span><span><b>{s.name}</b><small>{(s.durationMs/1000).toFixed(1)}s · {s.layers.length} layers</small></span><ChevronRight size={14}/></button>)}<button className="delete-scene" onClick={deleteScene}><Trash2 size={13}/>Delete scene</button></aside>
      <section className="scene-center">
        <div className="format-bar"><div><small>MASTER / RESPONSIVE PREVIEW</small><strong>{format.label}</strong></div><select value={formatId} onChange={e=>setFormatId(e.target.value)}>{RU_CORE_10.map(f=><option key={f.id} value={f.id}>{f.label} · {f.family}</option>)}</select></div>
        <div className="scene-canvas-wrap"><div className={`scene-canvas family-${format.family}`} style={{aspectRatio:`${format.width}/${format.height}`}}>{output.layers.map(item=><div key={item.id} className={`generated-layer role-${item.role} motion-${item.motion} ${playing?"is-playing":""}`} style={{left:`${item.box.x}%`,top:`${item.box.y}%`,width:`${item.box.w}%`,height:`${item.box.h}%`,color:item.color,background:item.role==="background"?item.color:undefined,fontSize:item.fontSize?`${item.fontSize}px`:undefined,"--dx":`${item.motionVector.x}%`,"--dy":`${item.motionVector.y}%`,"--duration":`${item.durationMs}ms`} as React.CSSProperties}>{item.role==="hero"||item.role==="graphic"?<span className="visual-placeholder">{item.role.toUpperCase()}</span>:item.text||item.name}</div>)}</div></div>
        <div className="scene-timeline"><div className="timeline-title"><strong>Scene timeline</strong><span>{(scene.durationMs/1000).toFixed(1)} sec</span></div>{scene.layers.map(l=><div key={l.id} className="timeline-row"><span>{l.name}</span><div className="timeline-track"><i style={{width:`${Math.min(100,Math.max(18,l.durationMs/scene.durationMs*100))}%`}}/></div><small>{l.motion}</small></div>)}</div>
      </section>
      <aside className="scene-panel layer-panel"><div className="panel-head"><div><small>SCENE {scenes.indexOf(scene)+1}</small><h3>Layers</h3></div><button onClick={addLayer}><Plus size={14}/></button></div><div className="layer-list">{scene.layers.map(l=><button key={l.id} className={`layer-item ${l.id===layer.id?"active":""}`} onClick={()=>setLayerId(l.id)}><Layers3 size={13}/><span><b>{l.name}</b><small>{l.role}</small></span><span onClick={e=>{e.stopPropagation();patchLayer.call(null,{})}}>{l.visible?<Eye size={13}/>:<EyeOff size={13}/>}</span></button>)}</div>{layer&&<div className="inspector"><small>ROLE</small><select value={layer.role} onChange={e=>patchLayer({role:e.target.value as LayerRole})}>{ROLES.map(r=><option key={r}>{r}</option>)}</select>{["headline","copy","cta","legal","logo"].includes(layer.role)&&<><small>CONTENT</small><textarea value={layer.text||""} onChange={e=>patchLayer({text:e.target.value})}/></>}<small>MOTION</small><select value={layer.motion} onChange={e=>patchLayer({motion:e.target.value as MotionPreset})}>{MOTIONS.map(m=><option key={m}>{m}</option>)}</select><div className="two"><label><small>DURATION</small><input type="number" min={0} max={3000} step={50} value={layer.durationMs} onChange={e=>patchLayer({durationMs:Number(e.target.value)})}/></label><label><small>EASING</small><select value={layer.easing} onChange={e=>patchLayer({easing:e.target.value as typeof layer.easing})}><option>ease-out</option><option>ease-in-out</option><option>linear</option></select></label></div><label className="visible-control"><input type="checkbox" checked={layer.visible} onChange={e=>patchLayer({visible:e.target.checked})}/>Visible in this scene</label></div>}</aside>
    </main>
    {generated&&<div className="generation-drawer"><div className="generation-head"><div><small>AUTOMATIC RESPONSIVE GENERATION</small><h3>10 formats × {scenes.length} scenes</h3></div><button onClick={()=>setGenerated(false)}>Close</button></div><div className="generation-grid">{RU_CORE_10.map(f=><button key={f.id} onClick={()=>{setFormatId(f.id);setGenerated(false)}}><div className="generation-thumb" style={{aspectRatio:`${f.width}/${f.height}`}}><span>{f.family}</span></div><b>{f.label}</b><small>{scenes.length} scenes · adaptive motion</small></button>)}</div></div>}
  </div>
}
