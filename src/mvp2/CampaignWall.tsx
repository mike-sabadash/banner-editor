import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowRight,Pause,Play,RefreshCcw} from 'lucide-react';
import type {Campaign,Placement,VisualFormat} from './domain';
import type {Locale} from './i18n';

type WallMode='creative'|'delivery';
type Command={type:'bannermatic:play'|'bannermatic:pause'|'bannermatic:seek'|'bannermatic:replay';time?:number};
const ttKnown=(p:Placement)=>Boolean(p.requirements.sourceUrl||p.requirements.sourceLabel&&!String(p.requirements.sourceLabel).toLowerCase().startsWith('unknown'));
const statusClass=(v:string)=>`bm-status bm-${v}`;
const svgDoc=(svg:string)=>`<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent}svg{display:block;width:100%;height:100%}</style></head><body>${svg}</body></html>`;
const isLive=(format:VisualFormat)=>Boolean(format.previewHtml||format.previewUrl);

function CreativePreview({format,command,onOpen}:{format:VisualFormat;command:Command;onOpen:()=>void}){
 const frame=useRef<HTMLIFrameElement>(null);const live=isLive(format);
 useEffect(()=>{if(live)frame.current?.contentWindow?.postMessage(command,'*')},[command,live]);
 if(format.previewHtml)return <div className="bm-live-frame" style={{aspectRatio:`${format.width}/${format.height}`}}><iframe ref={frame} srcDoc={format.previewHtml} title={`${format.size} live creative`} sandbox="allow-scripts"/><span className="bm-preview-kind">Live HTML</span><button className="bm-live-open" onClick={onOpen} aria-label="Open creative in Figma">↗</button></div>;
 if(format.previewUrl)return <div className="bm-live-frame" style={{aspectRatio:`${format.width}/${format.height}`}}><iframe ref={frame} src={format.previewUrl} title={`${format.size} live creative`} sandbox="allow-scripts allow-same-origin"/><span className="bm-preview-kind">Live HTML</span><button className="bm-live-open" onClick={onOpen} aria-label="Open creative in Figma">↗</button></div>;
 if(format.previewSvg)return <div className="bm-live-frame bm-snapshot-frame" style={{aspectRatio:`${format.width}/${format.height}`}}><iframe srcDoc={svgDoc(format.previewSvg)} title={`${format.size} published Figma preview`} sandbox=""/><span className="bm-preview-kind">Figma snapshot</span><button className="bm-live-open" onClick={onOpen} aria-label="Open creative in Figma">↗</button></div>;
 return <button className="bm-preview bm-placeholder-preview" style={{aspectRatio:`${format.width}/${format.height}`}} onClick={onOpen}><div className="bm-preview-copy"><strong>BANNERMATIC</strong><b>{format.size}</b><span>Development placeholder · Publish from Figma to replace it</span></div></button>;
}

export default function CampaignWall({campaign,locale,onOpenFigma}:{campaign:Campaign;locale:Locale;onOpenFigma:()=>void}){
 const [mode,setMode]=useState<WallMode>('creative'),[playing,setPlaying]=useState(false),[time,setTime]=useState(0),[nonce,setNonce]=useState(0);const started=useRef(0),raf=useRef<number|undefined>(undefined);
 const liveCount=useMemo(()=>campaign.formats.filter(isLive).length,[campaign.formats]);
 const maxDuration=useMemo(()=>Math.max(6,...campaign.formats.filter(isLive).map(f=>Number(f.durationSec)||0)),[campaign.formats]);
 useEffect(()=>{if(!liveCount&&playing)setPlaying(false)},[liveCount,playing]);
 useEffect(()=>{if(!playing){if(raf.current)cancelAnimationFrame(raf.current);return}started.current=performance.now()-time*1000;const tick=(now:number)=>{const next=Math.min(maxDuration,(now-started.current)/1000);setTime(next);if(next>=maxDuration){setPlaying(false);return}raf.current=requestAnimationFrame(tick)};raf.current=requestAnimationFrame(tick);return()=>{if(raf.current)cancelAnimationFrame(raf.current)}},[playing,maxDuration,nonce]);
 const command:Command=playing?{type:'bannermatic:play',time}:{type:'bannermatic:pause',time};const replay=()=>{if(!liveCount)return;setTime(0);setNonce(n=>n+1);setPlaying(true)};const seek=(value:number)=>{if(!liveCount)return;setTime(value);setNonce(n=>n+1)};const placement=(id:string)=>campaign.placements.find(p=>p.id===id);const ru=locale==='ru';
 return <>
  <div className="bm-wall-toolbar bm-wall-toolbar-v2"><div className="bm-segment"><button className={mode==='creative'?'active':''} onClick={()=>setMode('creative')}>Creative</button><button className={mode==='delivery'?'active':''} onClick={()=>setMode('delivery')}>Delivery</button></div><div className="bm-shared-playback"><button disabled={!liveCount} title={!liveCount?(ru?'Live HTML previews ещё не опубликованы':'No live HTML previews published yet'):''} onClick={()=>setPlaying(v=>!v)}>{playing?<Pause size={14}/>:<Play size={14}/>} {playing?(ru?'Пауза':'Pause all'):(ru?'Играть все':'Play all')}</button><button disabled={!liveCount} onClick={replay}><RefreshCcw size={14}/>{ru?'Сначала':'Replay all'}</button><label className={!liveCount?'disabled':''}><span>{time.toFixed(1)}s</span><input disabled={!liveCount} aria-label="Shared campaign playhead" type="range" min="0" max={maxDuration} step="0.1" value={time} onChange={e=>seek(Number(e.target.value))}/><em>{maxDuration.toFixed(1)}s</em></label><small>{liveCount}/{campaign.formats.length} live</small></div></div>
  <div className="bm-wall">{campaign.formats.map(format=>{const ps=format.placementIds.map(placement).filter(Boolean) as Placement[];const previewLabel=isLive(format)?'Live HTML':format.previewSvg?'Figma snapshot':'Not published';return <article className="bm-creative-card" key={format.id}><div className="bm-card-head"><div><b>{format.size}</b><span>{ps.length} placement{ps.length===1?'':'s'}</span></div><span className={statusClass(format.creativeState==='published'?'ready':format.creativeState==='draft'?'warning':'blocked')}>{format.creativeState}</span></div><CreativePreview format={format} command={command} onOpen={onOpenFigma}/>{mode==='creative'?<div className="bm-card-meta"><div><span>Creative version</span><b>v{format.creativeVersion}</b></div><div><span>Preview</span><b>{previewLabel}</b></div><button onClick={onOpenFigma}>{ru?'Открыть в Figma':'Open in Figma'}<ArrowRight size={13}/></button></div>:<div className="bm-card-meta"><div className="bm-placement-list">{ps.map(p=><div key={p.id}><span><b>{p.platform}</b><small>{p.placement}</small></span><em className={statusClass(ttKnown(p)?'ready':'unknown')}>{ttKnown(p)?'TT ✓':'TT ?'}</em></div>)}</div></div>}</article>})}</div>
 </>;
}
