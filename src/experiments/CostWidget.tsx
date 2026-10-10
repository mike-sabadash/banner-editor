import {useEffect,useRef,useState} from "react";
import "./costWidget.css";

export type CostRecord={id:string;formatId:string;cost:number;time:number};
export function CostWidget({records}:{records:CostRecord[]}){
 const [open,setOpen]=useState(false);
 const root=useRef<HTMLDivElement>(null);
 const trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(!open)return;const close=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false)};const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"){setOpen(false);trigger.current?.focus()}};document.addEventListener("pointerdown",close);document.addEventListener("keydown",escape);return()=>{document.removeEventListener("pointerdown",close);document.removeEventListener("keydown",escape)}},[open]);
 const total=records.reduce((sum,item)=>sum+item.cost,0);
 const last=records.at(-1);
 const money=(n:number)=>"$"+n.toFixed(n<0.01?5:3);
 const recent=records.slice(-5).reverse();
 const maxCost=Math.max(...recent.map(item=>item.cost),0);
 return <div className="rl-cost-root" ref={root}>
  <button ref={trigger} type="button" className="rl-cost-trigger" aria-label="Расходы OpenRouter" aria-expanded={open} aria-controls="rl-cost-popover" onClick={()=>setOpen(value=>!value)}><span aria-hidden="true">◉</span><span>{records.length?money(total):"AI costs"}</span></button>
  {open&&<section id="rl-cost-popover" className="rl-cost-popover" aria-label="Статистика OpenRouter">
   <div className="rl-cost-heading"><span>OpenRouter · расходы</span><button type="button" aria-label="Закрыть статистику" onClick={()=>setOpen(false)}>×</button></div>
   <div className="rl-cost-hero"><small>За текущую сессию</small><strong>{records.length?money(total):"—"}</strong><span>{records.length?"По данным ответов API":"Пока нет подтверждённых расходов"}</span></div>
   <div className="rl-cost-tiles"><div><small>Последняя генерация</small><strong>{last?money(last.cost):"—"}</strong></div><div><small>Учтено генераций</small><strong>{records.length}</strong></div></div>
   <div className="rl-cost-section"><strong>Последние генерации</strong>{recent.length>1&&<><div className="rl-cost-chart" role="img" aria-label="Сравнение стоимости последних генераций">{[...recent].reverse().map(item=><div key={item.id} className="rl-cost-bar" title={`${item.formatId}: ${money(item.cost)}`} style={{height:`${maxCost>0?Math.max(5,item.cost/maxCost*100):5}%`}}/>)}</div><div className="rl-cost-chart-caption"><span>Ранее</span><span>Последняя</span></div></>}{recent.length?<div className="rl-cost-history">{recent.map(item=><div key={item.id}><span>{item.formatId}<small>{new Date(item.time).toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"})}</small></span><b>{money(item.cost)}</b></div>)}</div>:<p>История появится после первой генерации с данными о стоимости.</p>}</div>
   <div className="rl-cost-foot">Баланс и токены: пока недоступны. В статистику включены только запросы, для которых API вернул стоимость. Данные хранятся до обновления страницы.</div>
  </section>}
 </div>
}