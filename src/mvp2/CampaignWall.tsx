import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowRight,Pause,Play,RefreshCcw} from 'lucide-react';
import type {Campaign,Placement,VisualFormat} from './domain';
import type {Locale} from './i18n';

type WallMode='creative'|'delivery';
type Command={type:'bannermatic:play'|'bannermatic:pause'|'bannermatic:seek'|'bannermatic:replay';time?:number};
const ttKnown=(p:Placement)=>Boolean(p.requirements.sourceUrl||p.requirements.sourceLabel&&!String(p.requirements.sourceLabel).toLowerCase().startsWith('unknown'));
const statusClass=(v:string)=>`bm-status bm-${v}`;

function LivePreview({format,command,onOpen}:{format:VisualFormat;command:Command;onOpen:()=>void}){
 const frame=useRef<HTMLIFrameElement>(null);
 useEffect(()=>{if(format.previewUrl)frame.current?.contentWindow?.postMessage(command,'*')},[command,format.previewUrl]);
 if(!format.previewUrl)return <button className="bm-preview bm-placeholder-preview" style={{aspectRatio:`${format.width}/${format.height}`}} onClick={onOpen}><div className="bm-preview-copy"><strong>BANNERMATIC</strong><b>{format.size}</b><span>Development placeholder · Publish from Figma to enable live preview</span></div></button>;
 return <div className="bm-live-frame" style={{aspectRatio:`${format.width}/${format.height}`}}><iframe ref={frame} src={format.previewUrl} title={`${format.size} live creative`} sandbox="allow-scripts allow-same-origin"/><button className="bm-live-open" onClick={onOpen} aria-label="Open creative in Figma">↗</button></div>;
}

export default function CampaignWall({campaign,locale,onOpenFigma}:{campaign:Campaign;locale:Locale;onOpenFigma:()=>void}){
 const [mode,setMode]=useState<WallMode>('creative'),[playing,setPlaying]=useState(false),[time,setTime]=useState(0),[nonce,setNonce]=useState(0);
 const started=useRef(0),raf=useRef<number|undefined>(undefined);
 const maxDuration=useMemo(()=>Math.max(6,...campaign.formats.map(f=>Number(f.durationSec)||0)),[campaign.formats]);
 useEffect(()=>{if(!playing){if(raf.current)cancelAnimationFrame(raf.current);return}started.current=performance.now()-time*1000;const tick=(now:number)=>{const next=Math.min(maxDuration,(now-started.current)/1000);setTime(next);if(next>=maxDuration){setPlaying(false);return}raf.current=requestAnimationFrame(tick)};raf.current=requestAnimationFrame(tick);return()=>{if(raf.current)cancelAnimationFrame(raf.current)}},[playing,maxDuration,nonce]);
 const command:Command=playing?{type:'bannermatic:play',time}:{type:'bannermatic:pause',time};
 const replay=()=>{setTime(0);setNonce(n=>n+1);setPlaying(true)};
 const seek=(value:number)=>{setTime(value);setNonce(n=>n+1)};
 const placement=(id:string)=>campaign.placements.find(p=>p.id===id);
 const ru=locale==='ru';
 return <>
  <div className="bm-wall-toolbar bm-wall-toolbar-v2"><div className="bm-segment"><button className={mode==='creative'?'active':''} onClick={()=>setMode('creative')}>{ru?'Creative':'Creative'}</button><button className={mode==='delivery'?'active':''} onClick={()=>setMode('delivery')}>{ru?'Delivery':'Delivery'}</button></div><div className="bm-shared-playback"><button onClick={()=>setPlaying(v=>!v)}>{playing?<Pause size={14}/>:<Play size={14}/>} {playing?(ru?'Пауза':'Pause all'):(ru?'Играть все':'Play all')}</button><button onClick={replay}><RefreshCcw size={14}/>{ru?'Сначала':'Replay all'}</button><label><span>{time.toFixed(1)}s</span><input aria-label="Shared campaign playhead" type="range" min="0" max={maxDuration} step="0.1" value={time} onChange={e=>seek(Number(e.target.value))}/><em>{maxDuration.toFixed(1)}s</em></label></div></div>
  <div className="bm-wall">{campaign.formats.map(format=>{const ps=format.placementIds.map(placement).filter(Boolean) as Placement[];return <article className="bm-creative-card" key={format.id}><div className="bm-card-head"><div><b>{format.size}</b><span>{ps.length} placement{ps.length===1?'':'s'}</span></div><span className={statusClass(format.creativeState==='published'?'ready':format.creativeState==='draft'?'warning':'blocked')}>{format.creativeState}</span></div><LivePreview format={format} command={command} onOpen={onOpenFigma}/>{mode==='creative'?<div className="bm-card-meta"><div><span>Creative version</span><b>v{format.creativeVersion}</b></div><div><span>Preview</span><b>{format.previewUrl?'Live HTML':'Not published'}</b></div><button onClick={onOpenFigma}>{ru?'Открыть в Figma':'Open in Figma'}<ArrowRight size={13}/></button></div>:<div className="bm-card-meta"><div className="bm-placement-list">{ps.map(p=><div key={p.id}><span><b>{p.platform}</b><small>{p.placement}</small></span><em className={statusClass(ttKnown(p)?'ready':'unknown')}>{ttKnown(p)?'TT ✓':'TT ?'}</em></div>)}</div></div>}</article>})}</div>
 </>;
}
