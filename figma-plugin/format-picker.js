// Browser-safe grouped format picker used by Campaign Setup.
// Kept separate from the monolithic legacy UI so the catalog can evolve safely.
export const FORMAT_PICKER_GROUPS=[
 {id:'popular',label:'Popular / high coverage',items:[[240,400],[300,250],[728,90]]},
 {id:'desktop',label:'Common desktop & display',items:[[300,600],[300,500],[336,280],[970,250],[160,600],[240,600],[300,300],[1000,120]]},
 {id:'mobile',label:'Mobile & app',items:[[320,50],[320,100],[320,480],[480,320]]},
 {id:'ssp',label:'Extended SSP / publisher',items:[[970,90],[200,200],[400,240],[580,400],[600,300]]},
 {id:'special',label:'Special / premium',items:[[1456,180],[640,268]]}
];
export function formatOptionsHtml(){return FORMAT_PICKER_GROUPS.map(g=>`<optgroup label="${g.label}">${g.items.map(([w,h])=>`<option value="${w}x${h}">${w}×${h}</option>`).join('')}</optgroup>`).join('')+`<optgroup label="Custom"><option value="custom">Custom size…</option></optgroup>`}
export function parseFormatValue(value){const m=String(value||'').match(/^(\d{2,4})x(\d{2,4})$/);return m?{width:Number(m[1]),height:Number(m[2])}:null}
export function installFormatPicker({select,add,onAdd}){if(!select||!add)return;select.innerHTML=formatOptionsHtml();add.addEventListener('click',()=>{const size=parseFormatValue(select.value);onAdd(size)});}
