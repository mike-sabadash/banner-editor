import {createScene,sequenceDuration,sceneAt,type BannerScene,type SceneCopy} from './resizeLabScenes';
import type {MotionSettings,MotionPreset} from './resizeLabEditing';
const choices:[MotionPreset,string][]=[['none','Нет'],['fade','Fade'],['slide-up','Slide up'],['slide-side','Slide side'],['scale','Scale']];
type Props={scenes:BannerScene[];active:number;onChange:(scenes:BannerScene[])=>void;onSelect:(index:number)=>void;baseCopy:SceneCopy;legacyMotion:MotionSettings;loop:boolean;onLoop:(value:boolean)=>void;playing:boolean;playhead:number;onPlay:()=>void;onSeek:(time:number)=>void};
export function SceneEditor(p:Props){
 const selected=p.scenes[Math.min(p.active,p.scenes.length-1)],total=sequenceDuration(p.scenes);
 const update=(patch:Partial<BannerScene>)=>p.onChange(p.scenes.map(s=>s.id===selected.id?{...s,...patch}:s));
 const move=(direction:number)=>{const from=p.scenes.indexOf(selected),to=from+direction;if(to<0||to>=p.scenes.length)return;const next=[...p.scenes];[next[from],next[to]]=[next[to],next[from]];p.onChange(next);p.onSelect(to)};
 const add=()=>{const scene=createScene(selected?.copy||p.baseCopy,p.scenes.length,selected?.motion||p.legacyMotion);p.onChange([...p.scenes,scene]);p.onSelect(p.scenes.length)};
 return <section className="rl-scene-editor" aria-label="Редактор сцен">
  <h2>Сцены баннера</h2><p>Тексты и анимация каждой сцены независимы. Изображение, стили и расположение слоёв берутся из дизайна формата.</p>
  <button type="button" onClick={add} disabled={p.scenes.length>=20}>+ Добавить сцену</button>
  {!p.scenes.length?<p>Добавьте первую сцену из текущего дизайна. До этого действует сохранённая анимация одного кадра.</p>:<>
   <div className="rl-scene-list" role="list" aria-label="Последовательность сцен">{p.scenes.map((scene,index)=><button role="listitem" type="button" key={scene.id} aria-pressed={selected.id===scene.id} onClick={()=>p.onSelect(index)}><span>{index+1}. {scene.name}</span><small>{(scene.duration/1000).toFixed(1)} s</small></button>)}</div>
   <div className="rl-sequence-controls"><button type="button" onClick={p.onPlay}>{p.playing?'Пауза':'Воспроизвести'}</button><button type="button" onClick={()=>p.onSeek(0)} aria-label="В начало">↤</button><output>{(p.playhead/1000).toFixed(1)} / {(total/1000).toFixed(1)} s</output></div>
   <label>Просмотр по времени<input aria-label="Время анимации" type="range" min={0} max={total} step={10} value={p.playhead} onChange={e=>p.onSeek(Number(e.target.value))}/></label>
   <small className="rl-scene-time">Сцена {sceneAt(p.scenes,p.playhead,p.loop).index+1} из {p.scenes.length}</small>
   <label className="rl-scene-loop"><input type="checkbox" checked={p.loop} onChange={e=>p.onLoop(e.target.checked)}/>Зациклить баннер</label>
   <div className="rl-scene-properties"><h3>Выбранная сцена</h3><label>Название<input aria-label="Название сцены" value={selected.name} maxLength={80} onChange={e=>update({name:e.target.value})}/></label>
   {(['headline','subline','cta'] as const).map(key=><label key={key}>{key.toUpperCase()}<input aria-label={`Scene ${key}`} value={selected.copy[key]} onChange={e=>update({copy:{...selected.copy,[key]:e.target.value}})}/></label>)}
   <label>Длительность, секунды<input aria-label="Длительность сцены" type="number" min={.5} max={30} step={.1} value={selected.duration/1000} onChange={e=>{const n=e.target.valueAsNumber;if(Number.isFinite(n))update({duration:Math.max(500,Math.min(30000,n*1000))})}}/></label>
   {(['preset','exit'] as const).map(key=><label key={key}>{key==='preset'?'Вход слоёв':'Уход слоёв'}<select aria-label={key==='preset'?'Вход сцены':'Уход сцены'} value={selected.motion[key]} onChange={e=>update({motion:{...selected.motion,[key]:e.target.value as MotionPreset}})}>{choices.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>)}
   {(['duration','exitDuration','stagger','delay','distance'] as const).map(key=><label key={key}>{({duration:'Длительность входа, ms',exitDuration:'Длительность ухода, ms',stagger:'Интервал слоёв, ms',delay:'Задержка входа, ms',distance:'Смещение, px'})[key]}<input type="number" aria-label={`Scene ${key}`} min={key==='duration'||key==='exitDuration'?100:0} max={key==='stagger'?400:key==='distance'?100:key==='delay'?10000:2000} step={key==='distance'?1:50} value={selected.motion[key]} onChange={e=>{const value=e.target.valueAsNumber;if(Number.isFinite(value))update({motion:{...selected.motion,[key]:Math.max(Number(e.target.min),Math.min(Number(e.target.max),value))}})}}/></label>)}
   <label>Плавность<select aria-label="Плавность сцены" value={selected.motion.easing} onChange={e=>update({motion:{...selected.motion,easing:e.target.value as MotionSettings["easing"]}})}><option value="ease-out">Ease out</option><option value="ease-in-out">Ease in out</option><option value="cubic-bezier(0.22, 1, 0.36, 1)">Smooth out</option></select></label><small>Короткая сцена пропорционально сокращает вход и уход. Оставшееся время — удержание.</small>
   <div className="rl-scene-actions"><button type="button" disabled={p.active===0} onClick={()=>move(-1)} aria-label="Сцену раньше">←</button><button type="button" disabled={p.active===p.scenes.length-1} onClick={()=>move(1)} aria-label="Сцену позже">→</button><button type="button" disabled={p.scenes.length>=20} onClick={()=>{const next=[...p.scenes];next.splice(p.active+1,0,{...selected,id:crypto.randomUUID(),name:selected.name+' · копия',copy:{...selected.copy},motion:{...selected.motion}});p.onChange(next);p.onSelect(p.active+1)}}>Дублировать</button><button type="button" onClick={()=>p.onChange(p.scenes.filter(s=>s.id!==selected.id))}>Удалить</button></div>
   </div>
  </>}
 </section>
}
