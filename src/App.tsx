import { useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronRight, CircleCheck, Download, Eye, EyeOff, GripVertical, Lock, MoreHorizontal, Play, Redo2, RotateCcw, Sparkles, Undo2, Unlock, ZoomIn, ZoomOut } from "lucide-react";
import { fitPreview, formats, initialElements, type BannerElement } from "./model";

const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));

export default function App(){
 const [activeFormat,setActiveFormat]=useState("master");
 const [elements,setElements]=useState(initialElements);
 const [selectedId,setSelectedId]=useState("headline");
 const [zoom,setZoom]=useState(76);
 const [playing,setPlaying]=useState(false);
 const format=formats.find(item=>item.id===activeFormat)!;
 const selected=elements.find(item=>item.id===selectedId)!;
 const preview=useMemo(()=>fitPreview(format.width,format.height),[format]);
 const patchSelected=(patch:Partial<BannerElement>)=>setElements(current=>current.map(item=>item.id===selectedId?{...item,...patch}:item));
 const toggleVisible=(id:string)=>setElements(current=>current.map(item=>item.id===id?{...item,visible:!item.visible}:item));
 return <main className="app-shell">
  <header className="topbar">
   <div className="brand-mark">B</div><button className="icon-button" aria-label="Back"><ArrowLeft size={18}/></button>
   <div className="project-name"><strong>Summer Product Launch</strong><span>Saved just now</span></div>
   <div className="topbar-actions"><button className="icon-button"><Undo2 size={17}/></button><button className="icon-button muted"><Redo2 size={17}/></button><div className="separator"/><button className="preview-button"><Play size={15} fill="currentColor"/> Preview</button><button className="export-button"><Download size={16}/> Export</button><button className="icon-button"><MoreHorizontal size={19}/></button></div>
  </header>
  <section className="workspace">
   <aside className="formats-panel">
    <div className="panel-heading"><div><span className="kicker">CAMPAIGN</span><h2>Formats</h2></div><span className="count">5</span></div>
    <div className="format-list">{formats.map(item=><button key={item.id} className={`format-card ${activeFormat===item.id?"active":""}`} onClick={()=>setActiveFormat(item.id)}><span className="miniature" style={{aspectRatio:`${item.width}/${item.height}`}}/><span className="format-meta"><strong>{item.label}</strong><small>{item.width} × {item.height}</small></span>{item.status==="ready"?<CircleCheck size={15} className="success"/>:item.status==="review"?<span className="review-dot"/>:null}</button>)}</div>
    <button className="adapt-button"><Sparkles size={16}/> Adapt all formats</button>
   </aside>
   <section className="editor-stage">
    <div className="stage-toolbar"><div><strong>{format.label}</strong><span>{format.width} × {format.height}</span></div><div className="zoom-control"><button onClick={()=>setZoom(v=>clamp(v-10,30,150))}><ZoomOut size={15}/></button><span>{zoom}%</span><button onClick={()=>setZoom(v=>clamp(v+10,30,150))}><ZoomIn size={15}/></button><button><ChevronDown size={14}/></button></div></div>
    <div className="canvas-wrap"><div className={`banner-canvas ${playing?"is-playing":""}`} style={{width:preview.width,height:preview.height,transform:`scale(${zoom/76})`}}><div className="orb orb-one"/><div className="orb orb-two"/><div className="product-shape"><span>01</span></div>{elements.filter(el=>el.visible).map(el=><button key={el.id} className={`canvas-element kind-${el.kind} ${selectedId===el.id?"selected":""}`} style={{left:`${el.x}%`,top:`${el.y}%`,width:`${el.width}%`,transform:`scale(${el.scale/100})`,transformOrigin:"left top"}} onClick={()=>setSelectedId(el.id)}>{el.text}</button>)}</div></div>
    <div className="timeline"><div className="timeline-head"><button className="play-button" onClick={()=>setPlaying(v=>!v)}><Play size={15} fill="currentColor"/></button><strong>Timeline</strong><span>6.0s</span><div className="timeline-spacer"/><button className="text-button"><RotateCcw size={14}/> Reset</button></div><div className="time-ruler"><span>0s</span><span>1s</span><span>2s</span><span>3s</span><span>4s</span><span>5s</span><span>6s</span></div><div className="scene-track"><div className="scene-label"><strong>Scene 1</strong><span>Intro</span></div><div className="scene-block scene-one">Product entrance</div><div className="scene-block scene-two">Message</div><div className="scene-block scene-three">End card</div></div></div>
   </section>
   <aside className="properties-panel">
    <div className="panel-heading property-title"><div><span className="kicker">SELECTED</span><h2>{selected.name}</h2></div><button className="icon-button"><MoreHorizontal size={18}/></button></div>
    <section className="property-section layers-section"><button className="section-title"><ChevronDown size={15}/> Layers <span>{elements.length}</span></button>{elements.map(item=><button key={item.id} className={`layer-row ${item.id===selectedId?"active":""}`} onClick={()=>setSelectedId(item.id)}><GripVertical size={14}/><span className={`layer-icon type-${item.kind}`}>{item.kind==="button"?"◉":"T"}</span><span>{item.name}</span><span className="row-spacer"/><span onClick={e=>{e.stopPropagation();toggleVisible(item.id)}}>{item.visible?<Eye size={14}/>:<EyeOff size={14}/>}</span>{item.locked&&<Lock size={13}/>}</button>)}</section>
    <section className="property-section"><button className="section-title"><ChevronDown size={15}/> Content</button><label className="field-label">Text</label><textarea value={selected.text} onChange={e=>patchSelected({text:e.target.value})}/></section>
    <section className="property-section"><button className="section-title"><ChevronDown size={15}/> Position & size</button><div className="field-grid"><label><span>X</span><input type="number" value={selected.x} onChange={e=>patchSelected({x:Number(e.target.value)})}/></label><label><span>Y</span><input type="number" value={selected.y} onChange={e=>patchSelected({y:Number(e.target.value)})}/></label><label><span>W</span><input type="number" value={selected.width} onChange={e=>patchSelected({width:Number(e.target.value)})}/></label><label><span>%</span><input type="number" value={selected.scale} onChange={e=>patchSelected({scale:Number(e.target.value)})}/></label></div></section>
    <section className="property-section compact"><button className="section-title"><ChevronRight size={15}/> Animation <span className="pill">Fade up</span></button></section>
    <section className="property-section compact"><button className="lock-row" onClick={()=>patchSelected({locked:!selected.locked})}>{selected.locked?<Lock size={15}/>:<Unlock size={15}/>}<span><strong>{selected.locked?"Locked for adaptation":"Allow adaptation"}</strong><small>{selected.locked?"AI Director cannot change it":"AI Director may reposition it"}</small></span></button></section>
   </aside>
  </section>
 </main>
}
