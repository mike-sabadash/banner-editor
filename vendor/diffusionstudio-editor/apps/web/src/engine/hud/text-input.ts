/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. */
import { Chars, RenderSurface, entityQuad } from '@diffusionstudio/runtime';
import { getDocumentEditor } from '../editor';
import type { Entity, World } from 'koota';
let mounted: { input: HTMLTextAreaElement; entity: Entity } | null = null;
export function mountTextInput(world: World, entity: Entity): void {
 const canvas=world.get(RenderSurface)?.canvas; const container=canvas instanceof HTMLCanvasElement?canvas.parentElement:null;
 if(!container||!entity.has(Chars)) return; mounted?.input.blur();
 const editor=getDocumentEditor(world); const original=entity.get(Chars)?.value??''; const q=entityQuad(world,entity); const r=container.getBoundingClientRect(); const res=world.get(RenderSurface)?.resolution??1;
 const input=document.createElement('textarea'); input.value=original; input.spellcheck=false;
 const left=Math.min(...q.map(p=>p.x))/res-r.left; const top=Math.min(...q.map(p=>p.y))/res-r.top; const width=(Math.max(...q.map(p=>p.x))-Math.min(...q.map(p=>p.x)))/res; const height=(Math.max(...q.map(p=>p.y))-Math.min(...q.map(p=>p.y)))/res;
 Object.assign(input.style,{position:'absolute',left:left+'px',top:top+'px',width:Math.max(40,width)+'px',height:Math.max(24,height)+'px',zIndex:'1001',resize:'none',overflow:'hidden',background:'rgba(0,0,0,.18)',color:'#fff',border:'1px solid #008CFF',outline:'none',padding:'0',margin:'0',boxSizing:'border-box',font:'inherit'});
 input.addEventListener('input',()=>editor.editText(entity,input.value));
 input.addEventListener('blur',()=>{input.remove();if(mounted?.input===input)mounted=null;});
 input.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){editor.editText(entity,original);input.blur();}if((e.metaKey||e.ctrlKey)&&e.key==='Enter')input.blur();});
 container.appendChild(input); input.focus(); input.select(); mounted={input,entity};
}
