from pathlib import Path

def replace_once(s, old, new, label):
    if new in s:
        return s
    if old not in s:
        raise SystemExit(f"required pattern missing: {label}")
    return s.replace(old, new, 1)

p = Path("src/web-scene/WebSceneEditor.tsx")
s = p.read_text()

# Text editing: stable caret/selection and sane defaults.
s=replace_once(s,'fontSize:30,fontWeight:600,fontFamily:"Inter"','fontSize:16,fontWeight:400,fontFamily:"Inter"',"text defaults")
s=replace_once(s,'onDoubleClick={e=>{e.stopPropagation();if(item.kind==="text")setEditingTextId(item.id);else if(item.kind==="image"){setLayerId(item.id);startCrop()}}}','onDoubleClick={e=>{e.stopPropagation();if(item.kind==="text"){const host=e.currentTarget;setEditingTextId(item.id);requestAnimationFrame(()=>{const el=host.querySelector("[contenteditable=true]") as HTMLElement|null;if(!el)return;el.focus();const range=document.createRange(),selection=window.getSelection();range.selectNodeContents(el);range.collapse(false);selection?.removeAllRanges();selection?.addRange(range)})}else if(item.kind==="image"){setLayerId(item.id);startCrop()}}}',"text caret")
s=replace_once(s,'onInput={e=>{if(editingTextId!==item.id)return;const el=e.currentTarget;patchLayerById(item.id,{text:el.textContent||""},false);requestAnimationFrame(()=>{const canvas=canvasRef.current;if(!canvas)return;const h=Math.max(1,el.scrollHeight/canvas.getBoundingClientRect().height*100);patchLayerById(item.id,{masterBox:{...item.box,h}},false)})}} onBlur={e=>{patchLayerById(item.id,{text:e.currentTarget.textContent||""},false);setEditingTextId(null)}}','onInput={e=>{if(editingTextId!==item.id)return;const el=e.currentTarget,canvas=canvasRef.current;if(!canvas)return;const h=Math.max(1,el.scrollHeight/canvas.getBoundingClientRect().height*100);el.parentElement?.style.setProperty("height",`${h}%`)}} onBlur={e=>{const el=e.currentTarget,canvas=canvasRef.current,h=canvas?Math.max(1,el.scrollHeight/canvas.getBoundingClientRect().height*100):item.box.h;patchLayerById(item.id,{text:el.textContent||"",masterBox:{...item.box,h}},false);setEditingTextId(null)}}',"text selection")

# Hand tool + Space panning.
s=replace_once(s,'Grid3X3,Image as ImageIcon,Layers3,Magnet,MousePointer2','Grid3X3,Hand,Image as ImageIcon,Layers3,Magnet,MousePointer2',"hand import")
s=replace_once(s,'type Tool="select"|"text"|"image"|"shape";','type Tool="select"|"hand"|"text"|"image"|"shape";',"hand tool")
s=replace_once(s,'[borderColor,setBorderColor]=useState("#000000"),[dragLayerId,setDragLayerId]=useState<string|null>(null);','[borderColor,setBorderColor]=useState("#000000"),[dragLayerId,setDragLayerId]=useState<string|null>(null),[timelineHeight,setTimelineHeight]=useState(()=>Math.min(460,Math.max(250,112+(scenes?.[0]?.layers?.length??4)*42))),[spaceHeld,setSpaceHeld]=useState(false),[loopPlayback,setLoopPlayback]=useState(campaign?.creativeDocument?.loop!==false);',"interaction state")
s=replace_once(s,'const canvasRef=useRef<HTMLDivElement>(null),imageInput=','const canvasRef=useRef<HTMLDivElement>(null),stageRef=useRef<HTMLDivElement>(null),imageInput=',"stage ref")
s=replace_once(s,'const beginMove=(e:ReactPointerEvent,item:ReturnType<typeof resolveSceneLayers>[number])=>{if(!editable||item.role==="background"||tool!=="select")return;','const beginMove=(e:ReactPointerEvent,item:ReturnType<typeof resolveSceneLayers>[number])=>{if(spaceHeld||tool==="hand")return;if(!editable||item.role==="background"||tool!=="select")return;',"pan bypass")
s=replace_once(s,' const beginResize=',' const beginStagePan=(e:ReactPointerEvent)=>{if(!(spaceHeld||tool==="hand")||!stageRef.current)return;e.preventDefault();const stage=stageRef.current,sx=e.clientX,sy=e.clientY,left=stage.scrollLeft,top=stage.scrollTop;stage.classList.add("is-panning");const move=(ev:PointerEvent)=>{stage.scrollLeft=left-(ev.clientX-sx);stage.scrollTop=top-(ev.clientY-sy)},up=()=>{stage.classList.remove("is-panning");removeEventListener("pointermove",move);removeEventListener("pointerup",up)};addEventListener("pointermove",move);addEventListener("pointerup",up)};\n const beginTimelineResize=(e:ReactPointerEvent)=>{e.preventDefault();e.stopPropagation();const handle=e.currentTarget as HTMLElement,sy=e.clientY,start=timelineHeight,pid=e.pointerId;handle.setPointerCapture?.(pid);handle.classList.add("dragging");const move=(ev:PointerEvent)=>{if(ev.pointerId!==pid)return;ev.preventDefault();setTimelineHeight(clamp(start+(sy-ev.clientY),220,Math.max(320,window.innerHeight-120)))},up=(ev:PointerEvent)=>{if(ev.pointerId!==pid)return;handle.classList.remove("dragging");try{handle.releasePointerCapture?.(pid)}catch{};handle.removeEventListener("pointermove",move);handle.removeEventListener("pointerup",up);handle.removeEventListener("pointercancel",up)};handle.addEventListener("pointermove",move);handle.addEventListener("pointerup",up);handle.addEventListener("pointercancel",up)};\n const setSceneDuration=(value:number)=>{const duration=Math.max(200,Math.round(value));checkpoint();setScenes(all=>all.map(s=>s.id===scene.id?{...s,durationMs:duration,layers:s.layers.map(l=>({...l,startMs:Math.min(l.startMs,Math.max(0,duration-40)),endMs:Math.min(Math.max(l.endMs,Math.min(duration,40)),duration)}))}:s))};\n const beginResize=',"pan timeline duration")
s=replace_once(s,'useEffect(()=>{const onKey=(e:KeyboardEvent)=>{const t=e.target as HTMLElement;if(t.matches("input,textarea,select,[contenteditable=true]"))return;','useEffect(()=>{const onKey=(e:KeyboardEvent)=>{const t=e.target as HTMLElement;if(t.matches("input,textarea,select,[contenteditable=true]"))return;if(e.code==="Space"){e.preventDefault();setSpaceHeld(true);return}',"space keydown")
s=replace_once(s,'addEventListener("keydown",onKey);return()=>removeEventListener("keydown",onKey)},[layer?.id,scene.id,cropEdit,formatId]);','const onUp=(e:KeyboardEvent)=>{if(e.code==="Space")setSpaceHeld(false)};addEventListener("keydown",onKey);addEventListener("keyup",onUp);return()=>{removeEventListener("keydown",onKey);removeEventListener("keyup",onUp)}},[layer?.id,scene.id,cropEdit,formatId]);',"space keyup")

# Selection can be cleared by clicking empty canvas/stage.
s=replace_once(s,'resolvedLayers=useMemo(()=>resolveSceneLayers(scene,format,responsive),[scene,format,responsive]),sourceLayer=scene?.layers.find(l=>l.id===layerId)??scene?.layers[0],resolvedLayer=resolvedLayers.find(l=>l.id===layerId)??resolvedLayers[0],layer=formatId==="master"?sourceLayer:resolvedLayer?{...resolvedLayer,masterBox:resolvedLayer.box}:sourceLayer,','resolvedLayers=useMemo(()=>resolveSceneLayers(scene,format,responsive),[scene,format,responsive]),sourceLayer=layerId?scene?.layers.find(l=>l.id===layerId):undefined,resolvedLayer=layerId?resolvedLayers.find(l=>l.id===layerId):undefined,layer=formatId==="master"?sourceLayer:resolvedLayer?{...resolvedLayer,masterBox:resolvedLayer.box}:sourceLayer,',"clearable selection")
s=replace_once(s,'const pointerPercent=(e:ReactPointerEvent)=>{const r=canvasRef.current!.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*100,y:(e.clientY-r.top)/r.height*100}},onCanvasPointerDown=(e:ReactPointerEvent)=>{if(!canCreate)return;if(tool==="text")','const pointerPercent=(e:ReactPointerEvent)=>{const r=canvasRef.current!.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*100,y:(e.clientY-r.top)/r.height*100}},onCanvasPointerDown=(e:ReactPointerEvent)=>{if(tool==="select"&&!((e.target as HTMLElement).closest?.(".bm-object"))){setLayerId("");setEditingTextId(null);return}if(!canCreate)return;if(tool==="text")',"canvas deselect")

# Persist loop/end playback mode.
s=replace_once(s,'formatOverrides:responsive.formatOverrides,updatedAt:new Date().toISOString()','formatOverrides:responsive.formatOverrides,loop:loopPlayback,updatedAt:new Date().toISOString()',"save loop")
s=replace_once(s,'},[scenes,responsive,campaign?.id]);','},[scenes,responsive,loopPlayback,campaign?.id]);',"loop save dependency")

# Real 1:1 artboard, hand tool, true resizable timeline.
s=replace_once(s,'<section className="bm-center">','<section className="bm-center" style={{"--bm-timeline-height":`${timelineHeight}px`} as React.CSSProperties}>',"resizable center")
s=replace_once(s,'<div className="bm-stage" onDragOver=','<div ref={stageRef} className={`bm-stage ${spaceHeld||tool==="hand"?"pan-ready":""}`} onPointerDown={e=>{if(spaceHeld||tool==="hand")beginStagePan(e);else if(!(e.target as HTMLElement).closest?.(".bm-canvas")){setLayerId("");setEditingTextId(null)}}} onDragOver=',"stage pan deselect")
s=replace_once(s,'<div className="bm-tools"><button className={tool==="select"?"active":""}','<div className="bm-tools"><button title="Select · V" className={tool==="select"?"active":""}',"select title")
s=replace_once(s,'</button><button disabled={!canCreate} className={tool==="text"?"active":""}','</button><button title="Hand · hold Space" className={tool==="hand"?"active":""} onClick={()=>setTool("hand")}><Hand size={16}/></button><button disabled={!canCreate} className={tool==="text"?"active":""}',"hand button")
s=replace_once(s,'className={`bm-canvas family-${format.family} editable`} style={{aspectRatio:`${format.width}/${format.height}`}}','className={`bm-canvas family-${format.family} editable`} style={{width:`${format.width}px`,height:`${format.height}px`,aspectRatio:`${format.width}/${format.height}`}}',"1:1 canvas")
s=replace_once(s,'<div className="bm-timeline"><div className="bm-timeline-head">','<div className="bm-timeline-resizer" title="Drag to resize timeline" onPointerDown={beginTimelineResize}/><div className="bm-timeline"><div className="bm-timeline-head">',"timeline splitter")
s=replace_once(s,'<span>{(scene.durationMs/1000).toFixed(1)} sec</span></div><div className="bm-scene-ruler">','<div className="bm-timeline-options"><label className="bm-loop-control"><input type="checkbox" checked={loopPlayback} onChange={e=>setLoopPlayback(e.target.checked)}/><span>Loop</span></label><label className="bm-duration-control"><span>Scene</span><input className="bm-duration-input" type="number" min="0.2" step="0.1" value={scene.durationMs/1000} onChange={e=>setSceneDuration(Number(e.target.value)*1000)}/><span>sec</span></label></div></div><div className="bm-scene-ruler">',"duration loop control")
s=s.replace('<div className="bm-stage-hint">{cropEdit?"Crop mode · drag image inside frame · Apply or Cancel":formatId==="master"?"Original Master · build once here; Adapt all formats creates the media-plan family automatically":"Inherited format · edit only when this format needs an exception"}</div>','{cropEdit&&<div className="bm-stage-hint">Crop mode · drag image inside frame · Apply or Cancel</div>}')

p.write_text(s)

# Preview must always start from scene 1 after data loads and respect loop/end mode.
preview_path=Path("src/web-scene/CampaignPreview.tsx")
v=preview_path.read_text()
v=replace_once(v,'setCampaign(c);void registerCampaignFonts','setCampaign(c);restartAt.current=performance.now();pausedAt.current=0;setClock(0);setPaused(false);void registerCampaignFonts',"preview starts scene one")
v=replace_once(v,'groups=FAMILY_ORDER.map(family=>({family,formats:formats.filter(format=>format.family===family).sort((a,b)=>a.width*a.height-b.width*b.height)})).filter(group=>group.formats.length),total=scenes.reduce((n,s)=>n+s.durationMs,0)||1;let local=clock%total,active=scenes[0];','groups=FAMILY_ORDER.map(family=>({family,formats:formats.filter(format=>format.family===family).sort((a,b)=>a.width*a.height-b.width*b.height)})).filter(group=>group.formats.length),total=scenes.reduce((n,s)=>n+s.durationMs,0)||1,loop=campaign?.creativeDocument?.loop!==false;let local=loop?clock%total:Math.min(clock,Math.max(0,total-1)),active=scenes[0];',"preview loop mode")
preview_path.write_text(v)

# CreativeDocument typing for playback mode.
domain_path=Path("src/mvp2/domain.ts")
d=domain_path.read_text()
d=replace_once(d,'formatOverrides?:Record<string,any>;\n updatedAt?:string;','formatOverrides?:Record<string,any>;\n loop?:boolean;\n updatedAt?:string;',"domain loop")
domain_path.write_text(d)

css_path = Path("src/web-scene/editorInteraction.css")
css = css_path.read_text()
marker = "/* editor-ux-pass-2026-09-18-v2 */"
if marker not in css:
    css += r'''
/* editor-ux-pass-2026-09-18-v2 */
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
.bm-center{min-height:0;overflow:hidden}
.bm-stage{display:block;min-height:0;overflow:auto;padding:0;cursor:default}
.bm-stage.pan-ready{cursor:grab}
.bm-stage.is-panning{cursor:grabbing!important;user-select:none}
.bm-canvas-frame{display:flex;align-items:center;justify-content:center;min-width:max(100%,420px);min-height:max(100%,420px);width:max-content;height:max-content;padding:72px}
.bm-canvas.family-tall,.bm-canvas.family-portrait,.bm-canvas.family-rectangle,.bm-canvas.family-wide,.bm-canvas.family-strip,.bm-canvas.family-micro-strip{max-width:none;max-height:none}
.bm-tools{position:sticky;left:50%;top:12px;width:max-content;transform:translateX(-50%);z-index:40}
.bm-timeline-resizer{position:relative;height:8px;background:#0c1016;border-top:1px solid #303744;border-bottom:1px solid #1d232c;cursor:ns-resize;z-index:15}
.bm-timeline-resizer:after{content:"";position:absolute;left:50%;top:2px;width:44px;height:3px;border-radius:3px;background:#4b5565;transform:translateX(-50%)}
.bm-timeline-resizer:hover:after{background:#8177ff}
.bm-timeline{min-height:0;height:100%;padding:10px 14px 18px;overflow:auto}
.bm-timeline-head{position:sticky;top:0;z-index:4;height:38px;background:#10141a}
.bm-timeline-head>div{min-width:0}
.bm-timeline-head small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bm-timeline-options,.bm-loop-control,.bm-duration-control{display:flex;align-items:center;gap:7px}
.bm-timeline-options{flex:0 0 auto}
.bm-loop-control,.bm-duration-control{color:var(--bm-muted);font-size:10px}
.bm-loop-control input{accent-color:#7367ff}
.bm-duration-input{width:62px;height:26px;padding:0 6px;border:1px solid var(--bm-line-strong);border-radius:5px;background:#171c24;color:var(--bm-text);font-variant-numeric:tabular-nums}
.bm-scene-ruler{position:sticky;top:38px;z-index:3;background:#10141a;margin-bottom:8px}
.bm-track-list{gap:4px;padding-bottom:16px}
.bm-track-row{grid-template-columns:150px minmax(240px,1fr) 110px;gap:12px;min-height:38px;height:38px;padding:0 8px}
.bm-track-row>span{font-size:10px;color:#b2bac7}
.bm-track{height:24px!important;border-radius:7px}
.bm-track .bm-timing-bar{top:3px!important;height:16px!important}
.bm-track-row>small{font-size:10px!important}
@media(max-width:1250px){.bm-workspace{grid-template-columns:230px minmax(500px,1fr) 270px}.bm-track-row{grid-template-columns:120px minmax(200px,1fr) 96px}}
'''
    css_path.write_text(css)
# Timeline layout correction: keep the panel bottom-anchored, give every layer a real row,
# and prevent rows from sliding underneath the controls/ruler.
css = css_path.read_text()
marker3 = "/* timeline-layout-fix-2026-09-18 */"
if marker3 not in css:
    css += r'''
/* timeline-layout-fix-2026-09-18 */
.bm-center{height:100%;grid-template-rows:48px minmax(0,1fr) 8px var(--bm-timeline-height,240px)}
.bm-timeline-resizer{align-self:stretch}
.bm-timeline{display:grid;grid-template-rows:38px 30px minmax(0,1fr);align-content:stretch;overflow:hidden;padding:0 14px 14px;background:#10141a}
.bm-timeline-head{position:relative;top:auto;height:38px;min-height:38px;border-bottom:1px solid var(--bm-line);background:#10141a}
.bm-scene-ruler{position:relative;top:auto;height:30px;min-height:30px;margin:0;padding:5px 110px 5px 150px;background:#10141a}
.bm-track-list{min-height:0;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;gap:5px;padding:5px 0 18px;scrollbar-gutter:stable}
.bm-track-row{flex:0 0 38px;height:38px;min-height:38px;grid-template-columns:150px minmax(240px,1fr) 110px;padding:0 8px}
.bm-track{height:24px!important}
.bm-track .bm-timing-bar{top:3px!important;height:16px!important}
@media(max-width:1250px){.bm-scene-ruler{padding-left:120px}.bm-track-row{grid-template-columns:120px minmax(200px,1fr) 96px}}
'''
    css_path.write_text(css)
# Final timeline sizing pass: default height fits all layer tracks and splitter gets a generous hit target.
css = css_path.read_text()
marker4 = "/* timeline-all-tracks-visible-2026-09-18 */"
if marker4 not in css:
    css += r'''
/* timeline-all-tracks-visible-2026-09-18 */
.bm-timeline-resizer{height:10px;min-height:10px;margin-top:-4px;padding-top:4px;cursor:ns-resize;touch-action:none}
.bm-timeline-resizer:before{content:"";position:absolute;inset:-7px 0 -7px;cursor:ns-resize}
.bm-timeline-resizer:after{top:4px;width:56px;height:3px}
.bm-timeline{grid-template-rows:42px 32px minmax(0,1fr);padding-bottom:10px}
.bm-timeline-head{height:42px;min-height:42px}
.bm-scene-ruler{height:32px;min-height:32px;padding-top:6px;padding-bottom:6px}
.bm-track-list{overflow-y:auto;padding-top:6px}
.bm-track-row{flex:0 0 42px;height:42px;min-height:42px}
'''
    css_path.write_text(css)
# Robust timeline splitter and spacious default.
css = css_path.read_text()
marker5 = "/* timeline-splitter-pointercapture-2026-09-18 */"
if marker5 not in css:
    css += r'''
/* timeline-splitter-pointercapture-2026-09-18 */
.bm-timeline-resizer{height:14px;min-height:14px;margin:0;position:relative;background:#0d1117;border-top:1px solid #343c49;border-bottom:1px solid #242a33;cursor:ns-resize;touch-action:none;user-select:none;z-index:50}
.bm-timeline-resizer:before{content:"";position:absolute;inset:-10px 0;cursor:ns-resize}
.bm-timeline-resizer:after{content:"";position:absolute;left:50%;top:5px;width:64px;height:4px;border-radius:4px;background:#566173;transform:translateX(-50%);pointer-events:none}
.bm-timeline-resizer:hover,.bm-timeline-resizer.dragging{background:#121722}
.bm-timeline-resizer:hover:after,.bm-timeline-resizer.dragging:after{background:#8b82ff}
.bm-timeline{min-height:220px}
.bm-track-list{min-height:0}
'''
    css_path.write_text(css)
# Runtime layout fix: make the timeline a fixed bottom overlay. This removes the
# parent grid/min-content constraint that was keeping the visible panel short.
src = p.read_text()
src = replace_once(src,
    '<section className="bm-center" style={{"--bm-timeline-height":`${timelineHeight}px`} as React.CSSProperties}>',
    '<section className="bm-center" style={{"--bm-timeline-height":`${timelineHeight}px`} as React.CSSProperties}>',
    "timeline center marker")
p.write_text(src)
css = css_path.read_text()
marker6 = "/* timeline-overlay-layout-2026-09-18 */"
if marker6 not in css:
    css += r'''
/* timeline-overlay-layout-2026-09-18 */
.bm-center{position:relative!important;display:grid!important;grid-template-rows:48px minmax(0,1fr)!important;height:100%!important;min-height:0!important;overflow:hidden!important;padding-bottom:var(--bm-timeline-height,390px)!important}
.bm-stage{grid-row:2!important;min-height:0!important;height:100%!important}
.bm-timeline-resizer{position:absolute!important;left:0!important;right:0!important;bottom:var(--bm-timeline-height,390px)!important;height:14px!important;min-height:14px!important;z-index:80!important;cursor:ns-resize!important}
.bm-timeline{position:absolute!important;left:0!important;right:0!important;bottom:0!important;height:var(--bm-timeline-height,390px)!important;min-height:220px!important;max-height:calc(100% - 100px)!important;box-sizing:border-box!important;z-index:70!important;display:grid!important;grid-template-rows:42px 32px minmax(0,1fr)!important;overflow:hidden!important}
.bm-track-list{height:100%!important;min-height:0!important;overflow-y:auto!important}
'''
    css_path.write_text(css)
# Timeline visual polish + two-axis stage pan.
src=p.read_text()
src=replace_once(src,
 'const stage=stageRef.current,sx=e.clientX,sy=e.clientY,left=stage.scrollLeft,top=stage.scrollTop;stage.classList.add("is-panning");const move=(ev:PointerEvent)=>{stage.scrollLeft=left-(ev.clientX-sx);stage.scrollTop=top-(ev.clientY-sy)}',
 'const stage=stageRef.current,sx=e.clientX,sy=e.clientY,left=stage.scrollLeft,top=stage.scrollTop;stage.classList.add("is-panning");const move=(ev:PointerEvent)=>{stage.scrollLeft=left-(ev.clientX-sx);stage.scrollTop=top-(ev.clientY-sy);stage.dataset.panX=String(stage.scrollLeft);stage.dataset.panY=String(stage.scrollTop)}',
 "two axis pan")
p.write_text(src)
css=css_path.read_text()
marker7="/* timeline-polish-pan-2026-09-18 */"
if marker7 not in css:
    css += r'''
/* timeline-polish-pan-2026-09-18 */
.bm-center{padding-bottom:calc(var(--bm-timeline-height,390px) + 14px)!important}
.bm-stage{overflow:scroll!important;scrollbar-gutter:stable both-edges;overscroll-behavior:contain}
.bm-canvas-frame{min-width:calc(100% + 520px)!important;min-height:calc(100% + 280px)!important;padding:56px 260px!important;box-sizing:border-box}
.bm-timeline-resizer{bottom:var(--bm-timeline-height,390px)!important}
.bm-timeline{border-top:0!important}
.bm-timeline-head{padding:0 8px!important}
.bm-scene-ruler{padding:5px 110px 5px 150px!important}
.bm-track-list{gap:2px!important;padding:4px 0 10px!important}
.bm-track-row{height:40px!important;min-height:40px!important;flex-basis:40px!important;padding:0 8px!important;border-radius:3px!important}
.bm-track-row:hover{background:#151a21!important}
.bm-track{height:20px!important;border-radius:5px!important}
.bm-track .bm-timing-bar{top:3px!important;height:14px!important;border-radius:3px!important}
.bm-timing-handle{width:7px!important;border-radius:2px!important}
'''
    css_path.write_text(css)
# Replace the overlay workaround with a real docked split layout. The overlay
# reserved space twice (stage padding + absolute timeline), which caused the
# large dead gap visible in production.
css=css_path.read_text()
marker8="/* timeline-docked-layout-2026-09-18 */"
if marker8 not in css:
    css += r'''
/* timeline-docked-layout-2026-09-18 */
.bm-center{position:relative!important;display:grid!important;grid-template-rows:48px minmax(0,1fr) 14px var(--bm-timeline-height,390px)!important;height:100%!important;min-height:0!important;overflow:hidden!important;padding-bottom:0!important}
.bm-stage{position:relative!important;grid-row:2!important;height:auto!important;min-height:0!important;overflow:scroll!important}
.bm-timeline-resizer{position:relative!important;grid-row:3!important;left:auto!important;right:auto!important;bottom:auto!important;width:100%!important;height:14px!important;min-height:14px!important;margin:0!important;z-index:80!important}
.bm-timeline{position:relative!important;grid-row:4!important;left:auto!important;right:auto!important;bottom:auto!important;height:auto!important;min-height:0!important;max-height:none!important;width:100%!important;z-index:70!important}
.bm-canvas-frame{min-width:calc(100% + 520px)!important;min-height:calc(100% + 280px)!important}
'''
    css_path.write_text(css)
# Timeline compact sizing + time ruler + playback playhead.
src=p.read_text()
old='<div className="bm-scene-ruler">{scenes.map(s=><button key={s.id} className={s.id===scene.id?"active":""} style={{width:`${s.durationMs/totalDuration*100}%`}} onClick={()=>{setSceneId(s.id);setLayerId(s.layers[0]?.id||"")}}>{s.name}</button>)}</div><div className="bm-track-list">'
new='<div className="bm-time-ruler">{Array.from({length:Math.max(2,Math.ceil(scene.durationMs/500)+1)},(_,i)=>{const ms=Math.min(i*500,scene.durationMs),left=ms/scene.durationMs*100;return <span key={ms} style={{left:`${left}%`}}><i/>{ms===0?"0":`${(ms/1000).toFixed(ms%1000?1:0)}s`}</span>})}</div><div className="bm-scene-ruler">{scenes.map(s=><button key={s.id} className={s.id===scene.id?"active":""} style={{width:`${s.durationMs/totalDuration*100}%`}} onClick={()=>{setSceneId(s.id);setLayerId(s.layers[0]?.id||"")}}>{s.name}</button>)}</div><div className="bm-track-list"><i className="bm-playhead" style={{left:`calc(150px + (100% - 260px) * ${clamp(scenePlayMs/Math.max(1,scene.durationMs),0,1)})`}}/>'
if old not in src: raise SystemExit("timeline ruler insertion point missing")
src=src.replace(old,new,1)
p.write_text(src)
css=css_path.read_text()
marker9="/* timeline-ruler-playhead-2026-09-18 */"
if marker9 not in css:
    css += r"""
/* timeline-ruler-playhead-2026-09-18 */
.bm-center{grid-template-rows:48px minmax(0,1fr) 6px var(--bm-timeline-height,286px)!important}
.bm-timeline-resizer{height:6px!important;min-height:6px!important;background:transparent!important;border:0!important;border-top:1px solid #343b47!important}
.bm-timeline-resizer:before{inset:-5px 0!important}
.bm-timeline-resizer:after{top:1px!important;width:54px!important;height:3px!important;background:#5b6676!important}
.bm-timeline{grid-template-rows:42px 24px 30px minmax(0,1fr)!important}
.bm-time-ruler{position:relative;height:24px;min-height:24px;margin:0 110px 0 150px;border-bottom:1px solid #262d37;color:#7f8998;font-size:9px;font-variant-numeric:tabular-nums}
.bm-time-ruler span{position:absolute;top:0;transform:translateX(-50%);height:24px;white-space:nowrap}
.bm-time-ruler span:first-child{transform:none}.bm-time-ruler i{display:block;width:1px;height:7px;margin:0 auto 2px;background:#596373}
.bm-track-list{position:relative!important}.bm-playhead{position:absolute;top:0;bottom:0;width:1px;background:#ff6258;z-index:20;pointer-events:none;transform:translateX(-.5px)}
.bm-playhead:before{content:"";position:absolute;top:-1px;left:-4px;width:9px;height:6px;background:#ff6258;clip-path:polygon(0 0,100% 0,50% 100%)}
"""
    css_path.write_text(css)
# Timeline v4: scene selectors in header, proper tick ruler, visible red playhead.
src=p.read_text()
old='<div className="bm-timeline-options"><label className="bm-loop-control">'
new='<div className="bm-timeline-options"><div className="bm-scene-tabs-top">{scenes.map((s,i)=><button key={s.id} className={s.id===scene.id?"active":""} onClick={()=>{setSceneId(s.id);setLayerId(s.layers[0]?.id||"")}}>{String(i+1).padStart(2,"0")} · {s.name}</button>)}</div><label className="bm-loop-control">'
if old not in src: raise SystemExit("timeline header options missing")
src=src.replace(old,new,1)
old='<div className="bm-time-ruler">{Array.from({length:Math.max(2,Math.ceil(scene.durationMs/500)+1)},(_,i)=>{const ms=Math.min(i*500,scene.durationMs),left=ms/scene.durationMs*100;return <span key={ms} style={{left:`${left}%`}}><i/>{ms===0?"0":`${(ms/1000).toFixed(ms%1000?1:0)}s`}</span>})}</div><div className="bm-scene-ruler">{scenes.map(s=><button key={s.id} className={s.id===scene.id?"active":""} style={{width:`${s.durationMs/totalDuration*100}%`}} onClick={()=>{setSceneId(s.id);setLayerId(s.layers[0]?.id||"")}}>{s.name}</button>)}</div><div className="bm-track-list"><i className="bm-playhead" style={{left:`calc(150px + (100% - 260px) * ${clamp(scenePlayMs/Math.max(1,scene.durationMs),0,1)})`}}/>'
new='<div className="bm-time-ruler">{Array.from({length:Math.max(2,Math.ceil(scene.durationMs/100)+1)},(_,i)=>{const ms=Math.min(i*100,scene.durationMs),left=ms/scene.durationMs*100,major=ms%500===0;return <span key={ms} className={major?"major":""} style={{left:`${left}%`}}><i/>{major&&(ms===0?"0:00":`0:${String(Math.round(ms/100)).padStart(2,"0")}`)}</span>})}</div><div className="bm-track-list"><i className="bm-playhead" style={{left:`calc(150px + (100% - 260px) * ${clamp(scenePlayMs/Math.max(1,scene.durationMs),0,1)})`}}/>'
if old not in src: raise SystemExit("old ruler/scenes block missing")
src=src.replace(old,new,1)
p.write_text(src)
css=css_path.read_text()
marker10="/* timeline-v4-professional-ruler-2026-09-18 */"
if marker10 not in css:
    css += r"""
/* timeline-v4-professional-ruler-2026-09-18 */
.bm-timeline{grid-template-rows:42px 34px minmax(0,1fr)!important}
.bm-timeline-head{overflow:visible!important}
.bm-timeline-options{min-width:0!important}
.bm-scene-tabs-top{display:flex;align-items:center;gap:3px;max-width:430px;overflow-x:auto;scrollbar-width:none}
.bm-scene-tabs-top::-webkit-scrollbar{display:none}
.bm-scene-tabs-top button{height:26px;padding:0 9px;border:1px solid #2b323d;border-radius:5px;background:#151a21;color:#8993a2;font-size:10px;white-space:nowrap}
.bm-scene-tabs-top button.active{border-color:#5361d8;background:#202744;color:#eef1ff}
.bm-scene-ruler{display:none!important}
.bm-time-ruler{position:relative!important;height:34px!important;min-height:34px!important;margin:0 110px 0 150px!important;border-bottom:1px solid #343c48!important;background:#10141a!important;color:#8c96a5!important;overflow:visible!important}
.bm-time-ruler span{position:absolute!important;bottom:0!important;top:auto!important;height:34px!important;transform:translateX(-50%)!important;font-size:9px!important;line-height:14px!important;color:#7d8795!important}
.bm-time-ruler span:first-child{transform:none!important}
.bm-time-ruler i{position:absolute!important;bottom:0!important;left:50%!important;width:1px!important;height:5px!important;margin:0!important;background:#4d5664!important}
.bm-time-ruler span.major i{height:11px!important;background:#778292!important}
.bm-time-ruler span.major{color:#a7afbb!important}
.bm-track-list{position:relative!important}
.bm-playhead{display:block!important;position:absolute!important;top:-34px!important;bottom:0!important;width:1px!important;min-width:1px!important;background:#ff4d45!important;z-index:100!important;pointer-events:none!important;transform:translateX(-.5px)!important;box-shadow:none!important}
.bm-playhead:before{content:""!important;display:block!important;position:absolute!important;top:0!important;left:-4px!important;width:9px!important;height:7px!important;background:#ff4d45!important;clip-path:polygon(0 0,100% 0,50% 100%)!important}
"""
    css_path.write_text(css)
# Timeline v5: true scene-time scale, exact track alignment, always-visible playback playhead.
src=p.read_text()
old='<div className="bm-time-ruler">{Array.from({length:Math.max(2,Math.ceil(scene.durationMs/100)+1)},(_,i)=>{const ms=Math.min(i*100,scene.durationMs),left=ms/scene.durationMs*100,major=ms%500===0;return <span key={ms} className={major?"major":""} style={{left:`${left}%`}}><i/>{major&&(ms===0?"0:00":`0:${String(Math.round(ms/100)).padStart(2,"0")}`)}</span>})}</div><div className="bm-track-list"><i className="bm-playhead" style={{left:`calc(150px + (100% - 260px) * ${clamp(scenePlayMs/Math.max(1,scene.durationMs),0,1)})`}}/>'
new='<div className="bm-time-ruler"><div className="bm-time-ruler-scale">{Array.from({length:Math.floor(scene.durationMs/100)+1},(_,i)=>{const ms=i*100,left=ms/scene.durationMs*100,major=ms%500===0;return <span key={ms} className={major?"major":""} style={{left:`${left}%`}}><i/>{major&&`${(ms/1000).toFixed(1)}s`}</span>})}<span className="major end" style={{left:"100%"}}><i/>{`${(scene.durationMs/1000).toFixed(1)}s`}</span></div></div><div className="bm-track-list"><div className="bm-playhead" style={{"--playhead-progress":clamp(scenePlayMs/Math.max(1,scene.durationMs),0,1)} as React.CSSProperties}/>'
if old not in src: raise SystemExit("v4 ruler/playhead block missing")
src=src.replace(old,new,1)
p.write_text(src)
css=css_path.read_text()
marker11="/* timeline-v5-real-time-playhead-2026-09-18 */"
if marker11 not in css:
    css += r"""
/* timeline-v5-real-time-playhead-2026-09-18 */
.bm-time-ruler{margin:0!important;padding:0 130px 0 170px!important;box-sizing:border-box!important;border-bottom:0!important}
.bm-time-ruler-scale{position:relative!important;width:100%!important;height:34px!important;border-bottom:1px solid #343c48!important}
.bm-time-ruler-scale span{position:absolute!important;bottom:0!important;top:auto!important;height:34px!important;transform:translateX(-50%)!important;font-size:9px!important;line-height:14px!important;color:#7d8795!important;white-space:nowrap!important}
.bm-time-ruler-scale span:first-child{transform:none!important}
.bm-time-ruler-scale span.end{transform:translateX(-100%)!important}
.bm-time-ruler-scale i{position:absolute!important;bottom:0!important;left:50%!important;width:1px!important;height:5px!important;background:#4d5664!important}
.bm-time-ruler-scale span:first-child i{left:0!important}
.bm-time-ruler-scale span.end i{left:100%!important}
.bm-time-ruler-scale span.major i{height:11px!important;background:#778292!important}
.bm-playhead{display:block!important;position:absolute!important;left:calc(170px + (100% - 300px) * var(--playhead-progress,0))!important;top:-34px!important;bottom:0!important;width:1px!important;height:auto!important;background:#ff4d45!important;z-index:999!important;pointer-events:none!important;transform:translateX(-.5px)!important;opacity:1!important}
.bm-playhead:before{content:""!important;position:absolute!important;top:0!important;left:-4px!important;width:9px!important;height:7px!important;background:#ff4d45!important;clip-path:polygon(0 0,100% 0,50% 100%)!important}
@media(max-width:1250px){.bm-time-ruler{padding-left:140px!important;padding-right:116px!important}.bm-playhead{left:calc(140px + (100% - 256px) * var(--playhead-progress,0))!important}}
"""
    css_path.write_text(css)
# Motion v2: independent IN/OUT presets with draggable duration handles on each layer track.
src=p.read_text()
src=src.replace('const beginTimelineEdit=(e:ReactPointerEvent,item:SceneLayer,mode:"start"|"end"|"move")=>{','const beginTimelineEdit=(e:ReactPointerEvent,item:SceneLayer,mode:"start"|"end"|"move"|"motion-in"|"motion-out")=>{')
old='if(mode==="start")patchLayerById(item.id,{startMs:Math.min(toMs(p.clientX),end-40)},false);else if(mode==="end")patchLayerById(item.id,{endMs:Math.max(toMs(p.clientX),start+40)},false);else{'
new='if(mode==="start")patchLayerById(item.id,{startMs:Math.min(toMs(p.clientX),end-40)},false);else if(mode==="end")patchLayerById(item.id,{endMs:Math.max(toMs(p.clientX),start+40)},false);else if(mode==="motion-in"){const d=clamp(toMs(p.clientX)-start,40,Math.max(40,end-start-(item.outMotionDurationMs??0)));patchLayerById(item.id,{motionDurationMs:Math.round(d)},false)}else if(mode==="motion-out"){const d=clamp(end-toMs(p.clientX),40,Math.max(40,end-start-item.motionDurationMs));patchLayerById(item.id,{outMotionDurationMs:Math.round(d)},false)}else{'
if old not in src: raise SystemExit("timeline edit branch missing")
src=src.replace(old,new,1)
old='<b className="bm-trim-handle end" onPointerDown={e=>beginTimelineEdit(e,l,"end")}/></i>'
new='<b className="bm-trim-handle end" onPointerDown={e=>beginTimelineEdit(e,l,"end")}/><b className="bm-motion-duration-handle in" title="IN animation duration" style={{left:`${clamp(l.motionDurationMs/Math.max(1,l.endMs-l.startMs)*100,0,100)}%`}} onPointerDown={e=>beginTimelineEdit(e,l,"motion-in")}/><b className="bm-motion-duration-handle out" title="OUT animation duration" style={{right:`${clamp((l.outMotionDurationMs??0)/Math.max(1,l.endMs-l.startMs)*100,0,100)}%`}} onPointerDown={e=>beginTimelineEdit(e,l,"motion-out")}/></i>'
if old not in src: raise SystemExit("track handles missing")
src=src.replace(old,new,1)
old='<div><small>MOTION PRESET</small><h3>{layer.motion}</h3><p>Click a preset or drag it directly onto an object on the Master.</p></div><div className="bm-preset-grid">{PRESETS.map(p=><button key={p.id} draggable className={layer.motion===p.id?"active":""} onClick={()=>patchLayer({motion:p.id})} onDragStart={e=>e.dataTransfer.setData("application/x-bm-motion",p.id)}><span>{p.glyph}</span><b>{p.label}</b></button>)}</div><div className="bm-two"><label><small>DURATION · MS</small><input type="number" value={layer.motionDurationMs} onChange={e=>patchLayer({motionDurationMs:Number(e.target.value)})}/></label><label><small>EASING</small>'
new='<div><small>IN MOTION</small><h3>{layer.motion}</h3><p>Choose how the layer enters. Drag the inner left handle on its timeline bar to set duration.</p></div><div className="bm-preset-grid">{PRESETS.map(p=><button key={p.id} draggable className={layer.motion===p.id?"active":""} onClick={()=>patchLayer({motion:p.id})} onDragStart={e=>e.dataTransfer.setData("application/x-bm-motion",p.id)}><span>{p.glyph}</span><b>{p.label}</b></button>)}</div><div className="bm-motion-out-title"><small>OUT MOTION</small><h3>{layer.outMotion??"none"}</h3><p>Choose how the layer leaves. Drag the inner right handle on its timeline bar to set duration.</p></div><div className="bm-preset-grid">{PRESETS.map(p=><button key={`out-${p.id}`} className={(layer.outMotion??"none")===p.id?"active":""} onClick={()=>patchLayer({outMotion:p.id,outMotionDurationMs:p.id==="none"?0:(layer.outMotionDurationMs||320)})}><span>{p.glyph}</span><b>{p.label}</b></button>)}</div><div className="bm-two"><label><small>IN · MS</small><input type="number" value={layer.motionDurationMs} onChange={e=>patchLayer({motionDurationMs:Number(e.target.value)})}/></label><label><small>OUT · MS</small><input type="number" value={layer.outMotionDurationMs??0} onChange={e=>patchLayer({outMotionDurationMs:Number(e.target.value)})}/></label></div><div className="bm-two"><label><small>EASING</small>'
if old not in src: raise SystemExit("motion panel missing")
src=src.replace(old,new,1)
# close the now-single easing label grid by replacing its original tail
src=src.replace('</select></label></div></div>}</aside></main>','</select></label></div></div>}</aside></main>',1)
p.write_text(src)

model=model_path.read_text() if (model_path:=Path("src/web-scene/sceneModel.ts")).exists() else ""
model=model.replace('motion:MotionPreset;motionDurationMs:number;easing:', 'motion:MotionPreset;motionDurationMs:number;outMotion?:MotionPreset;outMotionDurationMs?:number;easing:')
model=model.replace('motion:MotionPreset;motionDurationMs:number;easing:SceneLayer["easing"];', 'motion:MotionPreset;motionDurationMs:number;outMotion?:MotionPreset;outMotionDurationMs?:number;easing:SceneLayer["easing"];')
model=model.replace('motionDurationMs:layer.motionDurationMs,easing:layer.easing', 'motionDurationMs:layer.motionDurationMs,outMotion:layer.outMotion,outMotionDurationMs:layer.outMotionDurationMs,easing:layer.easing')
model_path.write_text(model)

css=css_path.read_text()
marker12="/* motion-in-out-handles-2026-09-19 */"
if marker12 not in css:
    css += r"""
/* motion-in-out-handles-2026-09-19 */
.bm-motion-duration-handle{position:absolute;top:-3px;width:9px;height:20px;border:1px solid #9aa8ff;background:#111722;border-radius:3px;cursor:ew-resize;z-index:8;transform:translateX(-50%);box-shadow:0 0 0 1px rgba(0,0,0,.35)}
.bm-motion-duration-handle:after{content:"";position:absolute;top:5px;left:3px;width:1px;height:8px;background:#aab4c6}
.bm-motion-duration-handle.out{transform:translateX(50%)}
.bm-track-row:not(.active) .bm-motion-duration-handle{opacity:.7}
.bm-track-row:hover .bm-motion-duration-handle,.bm-track-row.active .bm-motion-duration-handle{opacity:1}
.bm-motion-out-title{margin-top:14px;padding-top:14px;border-top:1px solid #2a3039}
"""
    css_path.write_text(css)
# Playback/crop/seek/shortcut production pass 2026-09-19.
src=p.read_text()
# Add deterministic IN/OUT playback transform/opacity, so OUT is driven by timeline time rather than mount-only CSS animation.
needle='const togglePlay=()=>{if(!playing){setPlayMs(sceneStart);startedAt.current=performance.now()-sceneStart}setPlaying(v=>!v)},openCampaignPreview='
repl='const playbackMotionStyle=(item:ReturnType<typeof resolveSceneLayers>[number])=>{if(!playing)return{};const span=Math.max(1,item.endMs-item.startMs),inDur=Math.min(item.motionDurationMs||0,span),outDur=Math.min(item.outMotionDurationMs||0,Math.max(0,span-inDur)),inP=inDur?clamp((scenePlayMs-item.startMs)/inDur,0,1):1,outP=outDur?clamp((item.endMs-scenePlayMs)/outDur,0,1):1,preset=outP<1?(item.outMotion??"none"):item.motion,p=outP<1?outP:inP,v=motionVector(preset,item.box),tx=(1-p)*v.x,ty=(1-p)*v.y,scale=preset==="scale-in"?.72+.28*p:1,opacity=preset==="none"?1:p;return{opacity,transform:"translate("+tx+"%,"+ty+"%) scale("+scale+")",animation:"none"} as React.CSSProperties};const seekTimeline=(e:ReactPointerEvent)=>{const el=e.currentTarget as HTMLElement,r=el.getBoundingClientRect(),seek=(x:number)=>{const local=clamp((x-r.left)/r.width,0,1)*scene.durationMs;setPlayMs(sceneStart+local);startedAt.current=performance.now()-(sceneStart+local)};seek(e.clientX);const move=(ev:PointerEvent)=>seek(ev.clientX),up=()=>{removeEventListener("pointermove",move);removeEventListener("pointerup",up)};addEventListener("pointermove",move);addEventListener("pointerup",up)};const togglePlay=()=>{if(!playing){const current=playMs>=sceneStart&&playMs<sceneStart+scene.durationMs?playMs:sceneStart;setPlayMs(current);startedAt.current=performance.now()-current}setPlaying(v=>!v)},openCampaignPreview='
if needle not in src: raise SystemExit("togglePlay anchor missing")
src=src.replace(needle,repl,1)
# Apply runtime motion style to each object.
needle='"--motion-duration":`${item.motionDurationMs}ms`} as React.CSSProperties}'
repl='"--motion-duration":item.motionDurationMs+"ms",...playbackMotionStyle(item)} as React.CSSProperties}'
if needle not in src: raise SystemExit("object style anchor missing")
src=src.replace(needle,repl,1)
# Ruler supports click/drag scrubbing.
needle='<div className="bm-time-ruler"><div className="bm-time-ruler-scale">'
repl='<div className="bm-time-ruler" onPointerDown={seekTimeline}><div className="bm-time-ruler-scale">'
if needle not in src: raise SystemExit("time ruler anchor missing")
src=src.replace(needle,repl,1)
# Space toggles playback; native text/form controls remain untouched. Cmd/Ctrl-Z is already handled above this insertion.
needle='const mod=e.metaKey||e.ctrlKey;if(mod&&e.key.toLowerCase()==="z")'
repl='const mod=e.metaKey||e.ctrlKey;if(e.code==="Space"&&!mod){e.preventDefault();togglePlay();return}if(mod&&e.key.toLowerCase()==="z")'
if needle not in src: raise SystemExit("keyboard anchor missing")
src=src.replace(needle,repl,1)
p.write_text(src)

# Ensure motionVector is available in the editor runtime.
src=p.read_text()
src=src.replace('generateScene,normalizeResponsiveState,', 'generateScene,motionVector,normalizeResponsiveState,',1)
p.write_text(src)

css=css_path.read_text()
marker13="/* playback-crop-ruler-fixes-2026-09-19 */"
if marker13 not in css:
    css += r"""
/* playback-crop-ruler-fixes-2026-09-19 */
.bm-object.kind-image.selected:not(.crop-editing){overflow:hidden!important}
.bm-time-ruler{padding-left:110px!important;padding-right:90px!important;cursor:crosshair!important;user-select:none!important}
.bm-playhead{left:calc(110px + (100% - 200px) * var(--playhead-progress,0))!important}
.bm-playhead:before{width:9px!important;height:7px!important;left:-4px!important;top:0!important}
@media(max-width:1250px){.bm-time-ruler{padding-left:110px!important;padding-right:90px!important}.bm-playhead{left:calc(110px + (100% - 200px) * var(--playhead-progress,0))!important}}
"""
    css_path.write_text(css)
# Compact layout polish: remove inspector horizontal overflow, space scene tabs, restore square play control.
css=css_path.read_text()
marker14="/* compact-layout-polish-2026-09-19 */"
if marker14 not in css:
    css += r"""
/* compact-layout-polish-2026-09-19 */
.bm-right{overflow-x:hidden!important}
.bm-right>*{max-width:100%;min-width:0}
.bm-motion-panel,.bm-preset-grid{min-width:0}
.bm-preset-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
.bm-timeline-head{gap:14px}
.bm-timeline-head>div:last-child{gap:8px!important}
.bm-timeline-head .bm-icon{width:34px!important;height:34px!important;min-width:34px!important;min-height:34px!important;flex:0 0 34px!important;padding:0!important;aspect-ratio:1/1}
.bm-scene-ruler{gap:7px}
.bm-scene-ruler button{border:1px solid #303846!important;border-radius:6px!important;padding:0 10px!important;min-width:72px}
"""
    css_path.write_text(css)
# Functional easing + cubic-bezier UX.
src=p.read_text()
src=src.replace('const playbackMotionStyle=(item:ReturnType<typeof resolveSceneLayers>[number])=>{if(!playing)return{};', 'const easingFn=(name:string)=>{if(name==="linear")return(t:number)=>t;if(name==="ease-in-out")return(t:number)=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;if(name==="ease-in")return(t:number)=>t*t;if(name==="cubic-bezier")return(t:number)=>t*t*(3-2*t);return(t:number)=>1-Math.pow(1-t,3)};const playbackMotionStyle=(item:ReturnType<typeof resolveSceneLayers>[number])=>{if(!playing)return{};',1)
src=src.replace('preset=outP<1?(item.outMotion??"none"):item.motion,p=outP<1?outP:inP,v=motionVector', 'preset=outP<1?(item.outMotion??"none"):item.motion,rawP=outP<1?outP:inP,p=easingFn(item.easing)(rawP),v=motionVector',1)
old='<label><small>EASING</small><select value={layer.easing} onChange={e=>patchLayer({easing:e.target.value as SceneLayer["easing"]})}><option>ease-out</option><option>ease-in-out</option><option>linear</option></select></label>'
new='<label className="bm-easing-control"><small>EASING</small><div className="bm-easing-preview"><svg viewBox="0 0 100 56" aria-hidden="true"><path d={layer.easing==="linear"?"M4 52 L96 4":layer.easing==="ease-in"?"M4 52 C42 52 70 36 96 4":layer.easing==="ease-in-out"?"M4 52 C25 52 25 4 96 4":layer.easing==="cubic-bezier"?"M4 52 C28 52 72 4 96 4":"M4 52 C58 52 82 18 96 4"}/></svg><select value={layer.easing} onChange={e=>patchLayer({easing:e.target.value as SceneLayer["easing"]})}><option value="ease-out">Ease out</option><option value="ease-in">Ease in</option><option value="ease-in-out">Ease in-out</option><option value="linear">Linear</option><option value="cubic-bezier">Cubic Bézier</option></select></div></label>'
if old not in src: raise SystemExit("easing UI anchor missing")
src=src.replace(old,new,1)
p.write_text(src)
model_path=Path("src/web-scene/sceneModel.ts")
model=model_path.read_text().replace('easing:"ease-out"|"ease-in-out"|"linear"', 'easing:"ease-out"|"ease-in"|"ease-in-out"|"linear"|"cubic-bezier"')
model_path.write_text(model)
css=css_path.read_text()
marker15="/* easing-ux-functional-2026-09-19 */"
if marker15 not in css:
    css += r"""
/* easing-ux-functional-2026-09-19 */
.bm-easing-control{grid-column:1/-1}
.bm-easing-preview{display:grid;grid-template-columns:72px minmax(0,1fr);gap:8px;align-items:center}
.bm-easing-preview svg{width:72px;height:44px;border:1px solid #2b3340;border-radius:6px;background:#11161d;padding:5px;overflow:visible}
.bm-easing-preview path{fill:none;stroke:#8b82ff;stroke-width:2}
.bm-easing-preview select{min-width:0}
"""
    css_path.write_text(css)
print("EDITOR_UX_PASS_V2_OK")
