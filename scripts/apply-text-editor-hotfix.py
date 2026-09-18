from pathlib import Path

p = Path("src/web-scene/WebSceneEditor.tsx")
s = p.read_text()

def replace_once(old, new, label):
    global s
    if new in s:
        return
    if old not in s:
        raise SystemExit(f"required pattern missing: {label}")
    s = s.replace(old, new, 1)

# Preserve the earlier text editing fix/defaults when deploying older server worktrees.
replace_once('fontSize:30,fontWeight:600,fontFamily:"Inter"', 'fontSize:16,fontWeight:400,fontFamily:"Inter"', "text defaults")
replace_once('onDoubleClick={e=>{e.stopPropagation();if(item.kind==="text")setEditingTextId(item.id);else if(item.kind==="image"){setLayerId(item.id);startCrop()}}}', 'onDoubleClick={e=>{e.stopPropagation();if(item.kind==="text"){const host=e.currentTarget;setEditingTextId(item.id);requestAnimationFrame(()=>{const el=host.querySelector("[contenteditable=true]") as HTMLElement|null;if(!el)return;el.focus();const range=document.createRange(),selection=window.getSelection();range.selectNodeContents(el);range.collapse(false);selection?.removeAllRanges();selection?.addRange(range)})}else if(item.kind==="image"){setLayerId(item.id);startCrop()}}}', "text caret")
replace_once('onInput={e=>{if(editingTextId!==item.id)return;const el=e.currentTarget;patchLayerById(item.id,{text:el.textContent||""},false);requestAnimationFrame(()=>{const canvas=canvasRef.current;if(!canvas)return;const h=Math.max(1,el.scrollHeight/canvas.getBoundingClientRect().height*100);patchLayerById(item.id,{masterBox:{...item.box,h}},false)})}} onBlur={e=>{patchLayerById(item.id,{text:e.currentTarget.textContent||""},false);setEditingTextId(null)}}', 'onInput={e=>{if(editingTextId!==item.id)return;const el=e.currentTarget,canvas=canvasRef.current;if(!canvas)return;const h=Math.max(1,el.scrollHeight/canvas.getBoundingClientRect().height*100);el.parentElement?.style.setProperty("height",`${h}%`)}} onBlur={e=>{const el=e.currentTarget,canvas=canvasRef.current,h=canvas?Math.max(1,el.scrollHeight/canvas.getBoundingClientRect().height*100):item.box.h;patchLayerById(item.id,{text:el.textContent||"",masterBox:{...item.box,h}},false);setEditingTextId(null)}}', "text selection")

replace_once('Grid3X3,Image as ImageIcon,Layers3,Magnet,MousePointer2', 'Grid3X3,Hand,Image as ImageIcon,Layers3,Magnet,MousePointer2', "hand import")
replace_once('type Tool="select"|"text"|"image"|"shape";', 'type Tool="select"|"hand"|"text"|"image"|"shape";', "hand tool")
replace_once('[borderColor,setBorderColor]=useState("#000000"),[dragLayerId,setDragLayerId]=useState<string|null>(null);', '[borderColor,setBorderColor]=useState("#000000"),[dragLayerId,setDragLayerId]=useState<string|null>(null),[timelineHeight,setTimelineHeight]=useState(260),[spaceHeld,setSpaceHeld]=useState(false);', "interaction state")
replace_once('const canvasRef=useRef<HTMLDivElement>(null),imageInput=', 'const canvasRef=useRef<HTMLDivElement>(null),stageRef=useRef<HTMLDivElement>(null),imageInput=', "stage ref")

replace_once('const beginMove=(e:ReactPointerEvent,item:ReturnType<typeof resolveSceneLayers>[number])=>{if(!editable||item.role==="background"||tool!=="select")return;', 'const beginMove=(e:ReactPointerEvent,item:ReturnType<typeof resolveSceneLayers>[number])=>{if(spaceHeld||tool==="hand")return;if(!editable||item.role==="background"||tool!=="select")return;', "pan bypass")
replace_once(' const beginResize=', ' const beginStagePan=(e:ReactPointerEvent)=>{if(!(spaceHeld||tool==="hand")||!stageRef.current)return;e.preventDefault();const stage=stageRef.current,sx=e.clientX,sy=e.clientY,left=stage.scrollLeft,top=stage.scrollTop;stage.classList.add("is-panning");const move=(ev:PointerEvent)=>{stage.scrollLeft=left-(ev.clientX-sx);stage.scrollTop=top-(ev.clientY-sy)},up=()=>{stage.classList.remove("is-panning");removeEventListener("pointermove",move);removeEventListener("pointerup",up)};addEventListener("pointermove",move);addEventListener("pointerup",up)};\n const beginTimelineResize=(e:ReactPointerEvent)=>{e.preventDefault();const sy=e.clientY,start=timelineHeight,move=(ev:PointerEvent)=>setTimelineHeight(clamp(start+(sy-ev.clientY),150,Math.max(220,window.innerHeight-180))),up=()=>{removeEventListener("pointermove",move);removeEventListener("pointerup",up)};addEventListener("pointermove",move);addEventListener("pointerup",up)};\n const setSceneDuration=(value:number)=>{const duration=Math.max(200,Math.round(value));checkpoint();setScenes(all=>all.map(s=>s.id===scene.id?{...s,durationMs:duration,layers:s.layers.map(l=>({...l,startMs:Math.min(l.startMs,Math.max(0,duration-40)),endMs:Math.min(Math.max(l.endMs,Math.min(duration,40)),duration)}))}:s))};\n const beginResize=', "pan and timeline resize")

replace_once('useEffect(()=>{const onKey=(e:KeyboardEvent)=>{const t=e.target as HTMLElement;if(t.matches("input,textarea,select,[contenteditable=true]"))return;', 'useEffect(()=>{const onKey=(e:KeyboardEvent)=>{const t=e.target as HTMLElement;if(t.matches("input,textarea,select,[contenteditable=true]"))return;if(e.code==="Space"){e.preventDefault();setSpaceHeld(true);return}', "space keydown")
replace_once('addEventListener("keydown",onKey);return()=>removeEventListener("keydown",onKey)},[layer?.id,scene.id,cropEdit,formatId]);', 'const onUp=(e:KeyboardEvent)=>{if(e.code==="Space")setSpaceHeld(false)};addEventListener("keydown",onKey);addEventListener("keyup",onUp);return()=>{removeEventListener("keydown",onKey);removeEventListener("keyup",onUp)}},[layer?.id,scene.id,cropEdit,formatId]);', "space keyup")

replace_once('<section className="bm-center">', '<section className="bm-center" style={{gridTemplateRows:`48px minmax(180px,1fr) 6px ${timelineHeight}px`}}>', "resizable center")
replace_once('<div className="bm-stage" onDragOver=', '<div ref={stageRef} className={`bm-stage ${spaceHeld||tool==="hand"?"pan-ready":""}`} onPointerDown={beginStagePan} onDragOver=', "stage pan")
replace_once('<div className="bm-tools"><button className={tool==="select"?"active":""}', '<div className="bm-tools"><button title="Select · V" className={tool==="select"?"active":""}', "select title")
replace_once('</button><button disabled={!canCreate} className={tool==="text"?"active":""}', '</button><button title="Hand · hold Space" className={tool==="hand"?"active":""} onClick={()=>setTool("hand")}><Hand size={16}/></button><button disabled={!canCreate} className={tool==="text"?"active":""}', "hand button")
replace_once('className={`bm-canvas family-${format.family} editable`} style={{aspectRatio:`${format.width}/${format.height}`}}', 'className={`bm-canvas family-${format.family} editable`} style={{width:`${format.width}px`,height:`${format.height}px`,aspectRatio:`${format.width}/${format.height}`}}', "1:1 canvas")

replace_once(' <div className="bm-timeline"><div className="bm-timeline-head">', ' <div className="bm-timeline-resizer" title="Drag to resize timeline" onPointerDown={beginTimelineResize}><i/></div><div className="bm-timeline"><div className="bm-timeline-head">', "timeline splitter")
replace_once('<span>{(scene.durationMs/1000).toFixed(1)} sec</span></div><div className="bm-scene-ruler">', '<label className="bm-duration-control"><span>Scene</span><input className="bm-duration-input" type="number" min="0.2" step="0.1" value={(scene.durationMs/1000).toFixed(1)} onChange={e=>setSceneDuration(Number(e.target.value)*1000)}/><span>sec</span></label></div><div className="bm-scene-ruler">', "scene duration control")

p.write_text(s)

css_path = Path("src/web-scene/editorInteraction.css")
css = css_path.read_text()
marker = "/* editor-ux-pass-2026-09-18 */"
if marker not in css:
    css += r'''
/* editor-ux-pass-2026-09-18 */
.bm-workspace{grid-template-columns:260px minmax(560px,1fr) 300px}
.bm-left{padding:16px 12px;overflow-x:hidden}
.bm-scenes,.bm-layers{gap:6px}
.bm-scene-row,.bm-layer-row{width:100%;min-width:0;overflow:hidden}
.bm-scene-row .bm-scene{grid-template-columns:38px minmax(0,1fr) 14px;padding:8px 6px;gap:8px}
.bm-layer-row .bm-layer{grid-template-columns:18px 18px minmax(0,1fr);padding:8px 6px;gap:8px}
.bm-layer-row .bm-layer>span:last-child,.bm-scene-row .bm-scene>span:nth-child(2){min-width:0;overflow:hidden}
.bm-layer-row .bm-layer b,.bm-layer-row .bm-layer small,.bm-scene-row b,.bm-scene-row small{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bm-row-actions{flex:0 0 auto;padding-right:4px;background:linear-gradient(90deg,transparent,#11151b 18%)}
.bm-layer-row.active .bm-row-actions,.bm-scene-row.active .bm-row-actions{background:linear-gradient(90deg,transparent,#1a2029 18%)}
.bm-center{min-height:0}
.bm-stage{display:block;overflow:auto;padding:0;cursor:default}
.bm-stage.pan-ready{cursor:grab}
.bm-stage.is-panning{cursor:grabbing!important;user-select:none}
.bm-canvas-frame{display:flex;align-items:center;justify-content:center;min-width:max(100%,420px);min-height:max(100%,420px);width:max-content;height:max-content;padding:72px}
.bm-canvas.family-tall,.bm-canvas.family-portrait,.bm-canvas.family-rectangle,.bm-canvas.family-wide,.bm-canvas.family-strip,.bm-canvas.family-micro-strip{max-width:none;max-height:none}
.bm-tools{position:sticky;left:50%;top:12px;width:max-content;transform:translateX(-50%);z-index:40}
.bm-timeline-resizer{position:relative;height:6px;background:#0c1016;border-top:1px solid var(--bm-line);border-bottom:1px solid var(--bm-line);cursor:ns-resize;z-index:15}
.bm-timeline-resizer i{position:absolute;left:50%;top:2px;width:42px;height:2px;border-radius:2px;background:#343c49;transform:translateX(-50%)}
.bm-timeline-resizer:hover i{background:#7d73ff}
.bm-timeline{min-height:0;padding:10px 14px 14px;overflow:auto}
.bm-timeline-head{position:sticky;top:0;z-index:4;height:36px;background:#10141a}
.bm-timeline-head>div{min-width:0}
.bm-timeline-head small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bm-duration-control{display:flex;align-items:center;gap:6px;color:var(--bm-muted);font-size:10px}
.bm-duration-input{width:62px;height:26px;padding:0 6px;border:1px solid var(--bm-line-strong);border-radius:5px;background:#171c24;color:var(--bm-text);font-variant-numeric:tabular-nums}
.bm-scene-ruler{position:sticky;top:36px;z-index:3;background:#10141a;margin-bottom:8px}
.bm-track-list{gap:4px;padding-bottom:8px}
.bm-track-row{grid-template-columns:150px minmax(240px,1fr) 110px;gap:12px;min-height:38px;height:38px;padding:0 8px}
.bm-track-row>span{font-size:10px;color:#b2bac7}
.bm-track{height:24px!important;border-radius:7px}
.bm-track .bm-timing-bar{top:3px!important;height:16px!important}
.bm-track-row>small{font-size:10px!important}
@media(max-width:1250px){.bm-workspace{grid-template-columns:230px minmax(500px,1fr) 270px}.bm-track-row{grid-template-columns:120px minmax(200px,1fr) 96px}}
'''
    css_path.write_text(css)
print("EDITOR_UX_PASS_OK")
