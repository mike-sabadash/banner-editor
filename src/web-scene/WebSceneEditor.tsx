import {useEffect,useMemo,useRef,useState,type PointerEvent as ReactPointerEvent} from "react";
import {ChevronRight,Eye,EyeOff,Image as ImageIcon,Layers3,MousePointer2,Pause,Play,Plus,RectangleHorizontal,Sparkles,Type,Upload} from "lucide-react";
import {DEFAULT_SCENES,MASTER_FORMAT,RU_CORE_10,generateScene,type Box,type LayerRole,type MotionPreset,type Scene,type SceneLayer} from "./sceneModel";
import "./sceneEditor.css";

const ROLES:LayerRole[]=["background","hero","logo","headline","copy","cta","legal","graphic"];
const PRESETS:{id:MotionPreset;label:string;glyph:string}[]=[
  {id:"none",label:"None",glyph:"•"},{id:"fade",label:"Fade",glyph:"◌"},{id:"from-left",label:"From left",glyph:"→"},{id:"from-right",label:"From right",glyph:"←"},
  {id:"from-top",label:"From top",glyph:"↓"},{id:"from-bottom",label:"From bottom",glyph:"↑"},{id:"scale-in",label:"Scale in",glyph:"↗"}
];
type Tool="select"|"text"|"image"|"shape";
const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));

export default function WebSceneEditor(){
  const [scenes,setScenes]=useState<Scene[]>(DEFAULT_SCENES);
  const [sceneId,setSceneId]=useState(DEFAULT_SCENES[0].id);
  const [layerId,setLayerId]=useState(DEFAULT_SCENES[0].layers[1].id);
  const [formatId,setFormatId]=useState("master");
  const [tool,setTool]=useState<Tool>("select");
  const [playing,setPlaying]=useState(false);
  const [playMs,setPlayMs]=useState(0);
  const [generated,setGenerated]=useState(false);
  const [inspectorTab,setInspectorTab]=useState<"design"|"motion">("design");
  const canvasRef=useRef<HTMLDivElement>(null);
  const imageInput=useRef<HTMLInputElement>(null);
  const startedAt=useRef(0);

  const scene=scenes.find(s=>s.id===sceneId)??scenes[0];
  const layer=scene.layers.find(l=>l.id===layerId)??scene.layers[0];
  const format=formatId==="master"?MASTER_FORMAT:RU_CORE_10.find(f=>f.id===formatId)??MASTER_FORMAT;
  const output=useMemo(()=>generateScene(scene,format),[scene,format]);
  const totalDuration=useMemo(()=>scenes.reduce((sum,s)=>sum+s.durationMs,0),[scenes]);
  const sceneStart=useMemo(()=>scenes.slice(0,Math.max(0,scenes.findIndex(s=>s.id===scene.id))).reduce((sum,s)=>sum+s.durationMs,0),[scenes,scene.id]);
  const scenePlayMs=playing?Math.max(0,playMs-sceneStart):0;
  const editable=formatId==="master";

  const patchLayerById=(targetId:string,patch:Partial<SceneLayer>)=>setScenes(all=>all.map(s=>s.id===scene.id?{...s,layers:s.layers.map(l=>l.id===targetId?{...l,...patch}:l)}:s));
  const patchLayer=(patch:Partial<SceneLayer>)=>layer&&patchLayerById(layer.id,patch);
  const addScene=()=>{const n=scenes.length+1,stamp=Date.now();const next:Scene={id:`scene-${stamp}`,name:`Scene ${n}`,durationMs:1800,layers:[{id:`bg-${stamp}`,name:"Background",kind:"shape",role:"background",color:"#151922",masterBox:{x:0,y:0,w:100,h:100},motion:"none",motionDurationMs:0,easing:"linear",startMs:0,endMs:1800,visible:true}]};setScenes(v=>[...v,next]);setSceneId(next.id);setLayerId(next.layers[0].id);setFormatId("master")};
  const addText=(x=12,y=16)=>{const id=`text-${crypto.randomUUID()}`;const next:SceneLayer={id,name:"Text",kind:"text",role:"headline",text:"Новый текст",color:"#ffffff",masterBox:{x,y,w:70,h:12},fontSize:30,fontWeight:650,motion:"fade",motionDurationMs:360,easing:"ease-out",startMs:0,endMs:scene.durationMs,visible:true};setScenes(all=>all.map(s=>s.id===scene.id?{...s,layers:[...s.layers,next]}:s));setLayerId(id);setTool("select")};
  const addShape=(x=25,y=35)=>{const id=`shape-${crypto.randomUUID()}`;const next:SceneLayer={id,name:"Graphic",kind:"shape",role:"graphic",color:"#6c5cff",masterBox:{x,y,w:50,h:28},motion:"scale-in",motionDurationMs:420,easing:"ease-out",startMs:0,endMs:scene.durationMs,visible:true};setScenes(all=>all.map(s=>s.id===scene.id?{...s,layers:[...s.layers,next]}:s));setLayerId(id);setTool("select")};
  const addImageFile=(file?:File)=>{if(!file)return;const reader=new FileReader();reader.onload=()=>{const id=`image-${crypto.randomUUID()}`;const next:SceneLayer={id,name:file.name,kind:"image",role:"hero",assetUrl:String(reader.result),fit:"cover",masterBox:{x:12,y:40,w:76,h:40},motion:"from-right",motionDurationMs:480,easing:"ease-out",startMs:0,endMs:scene.durationMs,visible:true};setScenes(all=>all.map(s=>s.id===scene.id?{...s,layers:[...s.layers,next]}:s));setLayerId(id);setTool("select")};reader.readAsDataURL(file)};
  const deleteLayer=()=>{if(!layer||scene.layers.length<=1)return;const rest=scene.layers.filter(l=>l.id!==layer.id);setScenes(all=>all.map(s=>s.id===scene.id?{...s,layers:rest}:s));setLayerId(rest[0].id)};

  const pointerPercent=(event:ReactPointerEvent)=>{const rect=canvasRef.current!.getBoundingClientRect();return{x:clamp((event.clientX-rect.left)/rect.width*100,0,100),y:clamp((event.clientY-rect.top)/rect.height*100,0,100)}};
  const onCanvasPointerDown=(event:ReactPointerEvent)=>{if(!editable)return;if(tool==="text"){const p=pointerPercent(event);addText(p.x,p.y);return}if(tool==="shape"){const p=pointerPercent(event);addShape(p.x,p.y);return}if(tool==="image")imageInput.current?.click()};
  const beginMove=(event:ReactPointerEvent,item:SceneLayer)=>{if(!editable||item.role==="background"||tool!=="select")return;event.stopPropagation();setLayerId(item.id);const rect=canvasRef.current!.getBoundingClientRect(),startX=event.clientX,startY=event.clientY,start=item.masterBox;const move=(e:PointerEvent)=>patchLayerById(item.id,{masterBox:{...start,x:clamp(start.x+(e.clientX-startX)/rect.width*100,0,100-start.w),y:clamp(start.y+(e.clientY-startY)/rect.height*100,0,100-start.h)}});const up=()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",up)};window.addEventListener("pointermove",move);window.addEventListener("pointerup",up)};
  const beginResize=(event:ReactPointerEvent,item:SceneLayer)=>{if(!editable)return;event.stopPropagation();const rect=canvasRef.current!.getBoundingClientRect(),startX=event.clientX,startY=event.clientY,start=item.masterBox,aspect=start.w/start.h;const move=(e:PointerEvent)=>{let w=clamp(start.w+(e.clientX-startX)/rect.width*100,4,100-start.x);let h=clamp(start.h+(e.clientY-startY)/rect.height*100,3,100-start.y);if(e.shiftKey){h=w/aspect;if(start.y+h>100){h=100-start.y;w=h*aspect}}patchLayerById(item.id,{masterBox:{...start,w,h}})};const up=()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",up)};window.addEventListener("pointermove",move);window.addEventListener("pointerup",up)};

  useEffect(()=>{if(!playing)return;startedAt.current=performance.now()-playMs;let raf=0;const tick=(now:number)=>{const next=(now-startedAt.current)%totalDuration;setPlayMs(next);let cursor=0;for(const s of scenes){if(next>=cursor&&next<cursor+s.durationMs){setSceneId(s.id);break}cursor+=s.durationMs}raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf)},[playing,totalDuration,scenes]);
  const togglePlay=()=>{if(!playing){setPlayMs(sceneStart);startedAt.current=performance.now()-sceneStart}setPlaying(v=>!v)};
  const applyPreset=(preset:MotionPreset)=>{if(layer)patchLayer({motion:preset})};

  return <div className="bm-shell">
    <input ref={imageInput} className="bm-hidden" type="file" accept="image/*" onChange={e=>{addImageFile(e.target.files?.[0]);e.currentTarget.value=""}}/>
    <header className="bm-topbar"><div className="bm-brand"><span className="bm-logo">B</span><div><strong>Bannermatic</strong><small>Campaign / Creative editor</small></div></div><div className="bm-top-actions"><span className="bm-save-state">● Saved</span><button className="bm-button" onClick={togglePlay}>{playing?<Pause size={15}/>:<Play size={15}/>} Preview</button><button className="bm-button primary" onClick={()=>setGenerated(true)}><Sparkles size={15}/>Generate formats</button></div></header>

    <main className="bm-workspace">
      <aside className="bm-left bm-panel">
        <div className="bm-section-head"><div><small>CAMPAIGN</small><h3>Scenes</h3></div><button className="bm-icon" onClick={addScene}><Plus size={15}/></button></div>
        <div className="bm-scenes">{scenes.map((s,i)=><button key={s.id} className={`bm-scene ${s.id===scene.id?"active":""}`} onClick={()=>{setPlaying(false);setSceneId(s.id);setLayerId(s.layers[0]?.id||"")}}><span className="bm-scene-no">{String(i+1).padStart(2,"0")}</span><span><b>{s.name}</b><small>{(s.durationMs/1000).toFixed(1)} sec · {s.layers.length} layers</small></span><ChevronRight size={14}/></button>)}</div>
        <div className="bm-divider"/>
        <div className="bm-section-head"><div><small>SCENE {scenes.indexOf(scene)+1}</small><h3>Layers</h3></div></div>
        <div className="bm-layers">{scene.layers.map(l=><button key={l.id} className={`bm-layer ${l.id===layer?.id?"active":""}`} onClick={()=>setLayerId(l.id)}><span className="bm-layer-icon">{l.kind==="text"?<Type size={13}/>:l.kind==="image"?<ImageIcon size={13}/>:<Layers3 size={13}/>}</span><span><b>{l.name}</b><small>{l.role}</small></span><span onClick={e=>{e.stopPropagation();patchLayerById(l.id,{visible:!l.visible})}}>{l.visible?<Eye size={13}/>:<EyeOff size={13}/>}</span></button>)}</div>
      </aside>

      <section className="bm-center">
        <div className="bm-stagebar"><div><span className="bm-status-dot"/><b>{format.label}</b><small>{format.width} × {format.height} · {formatId==="master"?"editable master":"responsive preview"}</small></div><select value={formatId} onChange={e=>setFormatId(e.target.value)}><option value="master">Master · 300×600</option>{RU_CORE_10.map(f=><option key={f.id} value={f.id}>{f.label} · {f.family}</option>)}</select></div>
        <div className="bm-stage">
          <div className="bm-tools" aria-label="Canvas tools">
            <button className={tool==="select"?"active":""} onClick={()=>setTool("select")} title="Select"><MousePointer2 size={17}/></button>
            <button className={tool==="text"?"active":""} onClick={()=>setTool("text")} title="Text"><Type size={17}/></button>
            <button className={tool==="image"?"active":""} onClick={()=>{setTool("image");imageInput.current?.click()}} title="Image"><ImageIcon size={17}/></button>
            <button className={tool==="shape"?"active":""} onClick={()=>setTool("shape")} title="Shape"><RectangleHorizontal size={17}/></button>
          </div>
          <div className="bm-canvas-frame"><div ref={canvasRef} className={`bm-canvas family-${format.family} ${editable?"editable":"preview"}`} style={{aspectRatio:`${format.width}/${format.height}`}} onPointerDown={onCanvasPointerDown}>
            {output.layers.filter(item=>playing?scenePlayMs>=item.startMs&&scenePlayMs<=item.endMs:true).map(item=><div key={`${scene.id}-${item.id}-${playing?"play":"still"}`} className={`bm-object kind-${item.kind} role-${item.role} motion-${item.motion} ${item.id===layer?.id?"selected":""} ${playing?"is-playing":""}`} style={{left:`${item.box.x}%`,top:`${item.box.y}%`,width:`${item.box.w}%`,height:`${item.box.h}%`,color:item.color,background:item.kind==="shape"?item.color:undefined,fontSize:item.fontSize?`${item.fontSize}px`:undefined,fontWeight:item.fontWeight,"--mx":`${item.motionVector.x}%`,"--my":`${item.motionVector.y}%`,"--motion-duration":`${item.motionDurationMs}ms`} as React.CSSProperties} onPointerDown={e=>beginMove(e,item)} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const preset=e.dataTransfer.getData("text/motion") as MotionPreset;if(PRESETS.some(p=>p.id===preset)){setLayerId(item.id);patchLayerById(item.id,{motion:preset})}}}>
              {item.kind==="image"&&item.assetUrl?<img src={item.assetUrl} alt="" style={{objectFit:item.fit??"cover"}}/>:item.kind==="text"?<span>{item.text}</span>:item.role!=="background"?<span className="bm-shape-label">{item.name}</span>:null}
              {editable&&item.id===layer?.id&&item.role!=="background"&&<><i className="bm-handle nw"/><i className="bm-handle ne"/><i className="bm-handle sw"/><i className="bm-handle se" onPointerDown={e=>beginResize(e,item)}/></>}
            </div>)}
          </div></div>
          {!editable&&<div className="bm-readonly-note">Responsive preview · edit the Master, then refine per-format overrides later</div>}
        </div>

        <div className="bm-timeline">
          <div className="bm-timeline-head"><div><button className="bm-icon" onClick={togglePlay}>{playing?<Pause size={14}/>:<Play size={14}/>}</button><b>Scene timeline</b><small>Visibility only · motion lives in presets</small></div><span>{(scene.durationMs/1000).toFixed(1)} sec</span></div>
          <div className="bm-scene-ruler">{scenes.map(s=><button key={s.id} className={s.id===scene.id?"active":""} style={{width:`${s.durationMs/totalDuration*100}%`}} onClick={()=>{setPlaying(false);setSceneId(s.id);setLayerId(s.layers[0]?.id||"")}}>{s.name}</button>)}</div>
          <div className="bm-track-list">{scene.layers.map(l=><div key={l.id} className={`bm-track-row ${l.id===layer?.id?"active":""}`} onClick={()=>setLayerId(l.id)}><span>{l.name}</span><div className="bm-track"><i style={{left:`${l.startMs/scene.durationMs*100}%`,width:`${Math.max(2,(l.endMs-l.startMs)/scene.durationMs*100)}%`}}/></div><small>{l.motion}</small></div>)}</div>
        </div>
      </section>

      <aside className="bm-right bm-panel">
        <div className="bm-inspector-tabs"><button className={inspectorTab==="design"?"active":""} onClick={()=>setInspectorTab("design")}>Design</button><button className={inspectorTab==="motion"?"active":""} onClick={()=>setInspectorTab("motion")}>Motion</button></div>
        {layer&&inspectorTab==="design"&&<div className="bm-inspector">
          <div className="bm-inspector-title"><div><small>SELECTED</small><h3>{layer.name}</h3></div><button className="bm-text-danger" onClick={deleteLayer}>Delete</button></div>
          <label><small>ROLE</small><select value={layer.role} onChange={e=>patchLayer({role:e.target.value as LayerRole})}>{ROLES.map(r=><option key={r}>{r}</option>)}</select></label>
          {layer.kind==="text"&&<><label><small>TEXT</small><textarea value={layer.text||""} onChange={e=>patchLayer({text:e.target.value})}/></label><div className="bm-two"><label><small>SIZE</small><input type="number" value={layer.fontSize??18} onChange={e=>patchLayer({fontSize:Number(e.target.value)})}/></label><label><small>WEIGHT</small><input type="number" min="100" max="900" step="50" value={layer.fontWeight??500} onChange={e=>patchLayer({fontWeight:Number(e.target.value)})}/></label></div></>}
          {layer.kind==="image"&&<label><small>IMAGE FIT</small><select value={layer.fit??"cover"} onChange={e=>patchLayer({fit:e.target.value as "cover"|"contain"})}><option value="cover">Cover</option><option value="contain">Contain</option></select></label>}
          {editable&&<><small>MASTER GEOMETRY</small><div className="bm-four">{(["x","y","w","h"] as const).map(key=><label key={key}><span>{key.toUpperCase()}</span><input type="number" step="0.5" value={Math.round(layer.masterBox[key]*10)/10} onChange={e=>patchLayer({masterBox:{...layer.masterBox,[key]:Number(e.target.value)}})}/></label>)}</div></>}
          <div className="bm-two"><label><small>IN · MS</small><input type="number" step="50" min="0" value={layer.startMs} onChange={e=>patchLayer({startMs:clamp(Number(e.target.value),0,layer.endMs)})}/></label><label><small>OUT · MS</small><input type="number" step="50" min={layer.startMs} max={scene.durationMs} value={layer.endMs} onChange={e=>patchLayer({endMs:clamp(Number(e.target.value),layer.startMs,scene.durationMs)})}/></label></div>
        </div>}
        {layer&&inspectorTab==="motion"&&<div className="bm-inspector bm-motion-panel">
          <div><small>MOTION PRESETS</small><h3>Drag a preset onto an object</h3><p>Directional motion adapts to every target format from the final responsive position.</p></div>
          <div className="bm-preset-grid">{PRESETS.map(p=><button key={p.id} draggable onDragStart={e=>e.dataTransfer.setData("text/motion",p.id)} onClick={()=>applyPreset(p.id)} className={layer.motion===p.id?"active":""}><span>{p.glyph}</span><b>{p.label}</b></button>)}</div>
          <div className="bm-divider"/><label><small>DURATION · MS</small><input type="number" step="50" min="0" value={layer.motionDurationMs} onChange={e=>patchLayer({motionDurationMs:Number(e.target.value)})}/></label><label><small>EASING</small><select value={layer.easing} onChange={e=>patchLayer({easing:e.target.value as SceneLayer["easing"]})}><option>ease-out</option><option>ease-in-out</option><option>linear</option></select></label>
          <div className="bm-motion-hint"><Sparkles size={14}/><span>Applied to <b>{layer.name}</b>. Responsive formats keep the intent, not master pixels.</span></div>
        </div>}
      </aside>
    </main>

    {generated&&<div className="bm-format-drawer"><div className="bm-drawer-head"><div><small>RESPONSIVE OUTPUT</small><h2>10 formats × {scenes.length} scenes</h2><p>Master geometry is remapped through semantic zones; motion stays relative to each target layout.</p></div><button className="bm-button" onClick={()=>setGenerated(false)}>Close</button></div><div className="bm-format-grid">{RU_CORE_10.map(f=><button key={f.id} onClick={()=>{setFormatId(f.id);setGenerated(false)}}><div className="bm-thumb" style={{aspectRatio:`${f.width}/${f.height}`}}><span>{f.family}</span></div><b>{f.label}</b><small>{f.family} · adaptive</small></button>)}</div></div>}
  </div>
}
