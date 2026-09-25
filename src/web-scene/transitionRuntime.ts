import type {CSSProperties} from "react";
import type {Box,GeneratedLayer,LayerRole,SceneTransition,TransitionPreset} from "./sceneModel";
export const TRANSITION_PRESETS:{id:TransitionPreset;label:string;description:string}[]=[
{id:"smart",label:"Smart Match",description:"Semantic continuity for shared elements."},{id:"dissolve",label:"Cross Dissolve",description:"Soft crossfade."},{id:"push-left",label:"Push Left",description:"Push scenes left."},{id:"push-right",label:"Push Right",description:"Push scenes right."},{id:"push-up",label:"Push Up",description:"Push scenes upward."},{id:"push-down",label:"Push Down",description:"Push scenes downward."},{id:"wipe-left",label:"Wipe Left",description:"Reveal next scene from right."},{id:"wipe-right",label:"Wipe Right",description:"Reveal next scene from left."},{id:"zoom-through",label:"Zoom Through",description:"Scale through the cut."},{id:"blur-dissolve",label:"Blur Dissolve",description:"Blur and crossfade."},{id:"replace-up",label:"Replace Up",description:"Swap content vertically."},{id:"none",label:"Cut",description:"Immediate cut."}];
export const TRANSITION_RECIPES:{id:TransitionPreset;label:string;description:string}[]=[
{id:"clean",label:"Clean",description:"Continuity + restrained text/background change."},{id:"product-focus",label:"Product Focus",description:"Product continuity, background dissolve, headline replace."},{id:"headline-change",label:"Headline Change",description:"Hold composition and swap messaging."},{id:"dynamic",label:"Dynamic",description:"Directional energy with semantic continuity."},{id:"editorial",label:"Editorial",description:"Measured text-led replacement."},{id:"cinematic",label:"Cinematic",description:"Slow zoom/blur with product continuity."}];
export const DEFAULT_TRANSITION:SceneTransition={preset:"smart",durationMs:400};
const clamp01=(n:number)=>Math.max(0,Math.min(1,n)),lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
export const interpolateBox=(a:Box,b:Box,p:number):Box=>({x:lerp(a.x,b.x,p),y:lerp(a.y,b.y,p),w:lerp(a.w,b.w,p),h:lerp(a.h,b.h,p)});
export const transitionProgress=(localMs:number,sceneDurationMs:number,transition?:SceneTransition)=>{const t=transition??DEFAULT_TRANSITION,d=Math.max(0,Math.min(t.durationMs,sceneDurationMs*.8));return d<=0?0:clamp01((localMs-(sceneDurationMs-d))/d)};
export const semanticKey=(layer:Pick<GeneratedLayer,"semanticRole"|"role"|"kind">)=>`${layer.semanticRole||layer.role}:${layer.kind}`;
export function matchLayer(layer:GeneratedLayer,next:GeneratedLayer[]){return next.find(n=>semanticKey(n)===semanticKey(layer))??next.find(n=>n.role===layer.role&&n.kind===layer.kind)}
const recipeMode=(preset:TransitionPreset,role:LayerRole):TransitionPreset=>{
if(preset==="clean")return role==="background"?"dissolve":role==="headline"||role==="copy"?"replace-up":"smart";
if(preset==="product-focus")return role==="background"?"dissolve":role==="headline"||role==="copy"?"replace-up":"smart";
if(preset==="headline-change")return role==="headline"||role==="copy"?"replace-up":"smart";
if(preset==="dynamic")return role==="background"?"push-left":role==="headline"||role==="copy"?"replace-up":"smart";
if(preset==="editorial")return role==="background"?"dissolve":role==="headline"||role==="copy"?"replace-up":"smart";
if(preset==="cinematic")return role==="background"?"blur-dissolve":role==="headline"||role==="copy"?"dissolve":"smart";return preset};
export function sceneTransitionStyle(preset:TransitionPreset,role:LayerRole,phase:"out"|"in",p:number,shared=false):CSSProperties{const mode=recipeMode(preset,role),q=clamp01(p);
if(mode==="none")return{opacity:phase==="out"?(q<1?1:0):(q<1?0:1)};if(mode==="smart"&&shared)return{opacity:1};if(mode==="dissolve"||mode==="smart")return{opacity:phase==="out"?1-q:q};
if(mode==="replace-up"){const y=phase==="out"?-18*q:18*(1-q);return{opacity:phase==="out"?1-q:q,transform:`translate3d(0,${y}%,0)`}}
if(mode==="push-left"){const x=phase==="out"?-100*q:100*(1-q);return{transform:`translate3d(${x}%,0,0)`}}if(mode==="push-right"){const x=phase==="out"?100*q:-100*(1-q);return{transform:`translate3d(${x}%,0,0)`}}
if(mode==="push-up"){const y=phase==="out"?-100*q:100*(1-q);return{transform:`translate3d(0,${y}%,0)`}}if(mode==="push-down"){const y=phase==="out"?100*q:-100*(1-q);return{transform:`translate3d(0,${y}%,0)`}}
if(mode==="wipe-left")return phase==="out"?{}:{clipPath:`inset(0 0 0 ${100*(1-q)}%)`};if(mode==="wipe-right")return phase==="out"?{}:{clipPath:`inset(0 ${100*(1-q)}% 0 0)`};
if(mode==="zoom-through"){const scale=phase==="out"?1+.12*q:.88+.12*q;return{opacity:phase==="out"?1-q*.65:q,transform:`scale(${scale})`}}if(mode==="blur-dissolve"){const blur=phase==="out"?8*q:8*(1-q);return{opacity:phase==="out"?1-q:q,filter:`blur(${blur}px)`}}return{}}
export function transitionBoxFor(layer:GeneratedLayer,next:GeneratedLayer[],preset:TransitionPreset,p:number):Box{const mode=recipeMode(preset,layer.role),match=matchLayer(layer,next);return mode==="smart"&&match?interpolateBox(layer.box,match.box,p):layer.box}
