from pathlib import Path

p = Path("src/web-scene/WebSceneEditor.tsx")
s = p.read_text()

replacements = [
    ('fontSize:30,fontWeight:600,fontFamily:"Inter"', 'fontSize:16,fontWeight:400,fontFamily:"Inter"'),
    ('onDoubleClick={e=>{e.stopPropagation();if(item.kind==="text")setEditingTextId(item.id);else if(item.kind==="image"){setLayerId(item.id);startCrop()}}}', 'onDoubleClick={e=>{e.stopPropagation();if(item.kind==="text"){const host=e.currentTarget;setEditingTextId(item.id);requestAnimationFrame(()=>{const el=host.querySelector("[contenteditable=true]") as HTMLElement|null;if(!el)return;el.focus();const range=document.createRange(),selection=window.getSelection();range.selectNodeContents(el);range.collapse(false);selection?.removeAllRanges();selection?.addRange(range)})}else if(item.kind==="image"){setLayerId(item.id);startCrop()}}}'),
    ('onInput={e=>{if(editingTextId!==item.id)return;const el=e.currentTarget;patchLayerById(item.id,{text:el.textContent||""},false);requestAnimationFrame(()=>{const canvas=canvasRef.current;if(!canvas)return;const h=Math.max(1,el.scrollHeight/canvas.getBoundingClientRect().height*100);patchLayerById(item.id,{masterBox:{...item.box,h}},false)})}} onBlur={e=>{patchLayerById(item.id,{text:e.currentTarget.textContent||""},false);setEditingTextId(null)}}', 'onInput={e=>{if(editingTextId!==item.id)return;const el=e.currentTarget,canvas=canvasRef.current;if(!canvas)return;const h=Math.max(1,el.scrollHeight/canvas.getBoundingClientRect().height*100);el.parentElement?.style.setProperty("height",`${h}%`)}} onBlur={e=>{const el=e.currentTarget,canvas=canvasRef.current,h=canvas?Math.max(1,el.scrollHeight/canvas.getBoundingClientRect().height*100):item.box.h;patchLayerById(item.id,{text:el.textContent||"",masterBox:{...item.box,h}},false);setEditingTextId(null)}}'),
]

changed = False
for old, new in replacements:
    if new in s:
        continue
    if old not in s:
        raise SystemExit("required text editor pattern missing")
    s = s.replace(old, new, 1)
    changed = True

if changed:
    p.write_text(s)
print("TEXT_EDITOR_HOTFIX_OK")
