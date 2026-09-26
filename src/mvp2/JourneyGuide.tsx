import {Check,ChevronRight,FileSpreadsheet,Flag,Layers3,ShieldCheck,WandSparkles} from 'lucide-react';
import type {Campaign} from './domain';
import type {Locale} from './i18n';

type Step='overview'|'media'|'creative'|'delivery';
const steps:Array<{id:Step;icon:any;en:string;ru:string}>=[
 {id:'overview',icon:Flag,en:'Campaign',ru:'Кампания'},
 {id:'media',icon:FileSpreadsheet,en:'Media plan',ru:'Медиаплан'},
 {id:'creative',icon:Layers3,en:'Creative',ru:'Креатив'},
 {id:'delivery',icon:ShieldCheck,en:'Delivery',ru:'Delivery'},
];
export default function JourneyGuide({campaign,locale,current,onNavigate}:{campaign:Campaign;locale:Locale;current:Step;onNavigate:(s:Step)=>void}){
 const ru=locale==='ru';
 const mediaDone=campaign.placements.length>0;
 const creativeDone=mediaDone&&campaign.formats.length>0&&campaign.formats.every(f=>f.creativeState==='published');
 const deliveryDone=creativeDone&&campaign.status==='delivered';
 const complete:Record<Step,boolean>={overview:true,media:mediaDone,creative:creativeDone,delivery:deliveryDone};
 const next=!mediaDone?'media':!creativeDone?'creative':!deliveryDone?'delivery':'delivery';
 const message=!mediaDone?(ru?'Добавьте медиаплан или placements вручную. Bannermatic соберёт required creative set.':'Attach a media plan or add placements manually. Bannermatic will compile the required creative set.'):!creativeDone?(ru?'Подключите Figma, создайте недостающие форматы и опубликуйте creative.':'Connect Figma, create the missing formats and publish creative.'):!deliveryDone?(ru?'Проверьте TT и compliance. Когда все placements готовы — соберите Campaign Build.':'Review TT and compliance. When every placement is ready, build the campaign.'):(ru?'Кампания собрана. Можно проверять версии и delivery history.':'Campaign is built. You can review versions and delivery history.');
 return <section className="ne-journey"><div className="ne-journey-copy"><span><WandSparkles size={13}/>{ru?'Следующий шаг':'Next step'}</span><p>{message}</p></div><div className="ne-journey-steps">{steps.map((step,index)=>{const Icon=step.icon,done=complete[step.id],active=current===step.id;return <div className="ne-journey-step" key={step.id}>{index>0&&<i/>}<button className={`${active?'active ':''}${done?'done':''}`} onClick={()=>onNavigate(step.id)}><b>{done?<Check size={11}/>:<Icon size={11}/>}</b><span>{ru?step.ru:step.en}</span></button></div>})}</div><button className="ne-journey-next" onClick={()=>onNavigate(next)}>{ru?'Продолжить':'Continue'}<ChevronRight size={13}/></button></section>;
}
