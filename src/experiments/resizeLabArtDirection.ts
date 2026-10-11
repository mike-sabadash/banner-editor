export type SavedDirection={sourceHash:string;version:number;plans:Record<string,unknown>;[key:string]:unknown};
export type SavedDirections=Record<string,SavedDirection>;
// Keep opaque versioned records intact; the server verifies their signature and schema.
export function restoreArtDirections(value:unknown):SavedDirections{
 if(!value||typeof value!=='object'||Array.isArray(value))return {};
 return Object.fromEntries(Object.entries(value).filter(([key,item])=>/^[a-f0-9]{64}$/.test(key)&&item&&typeof item==='object'&&(item as SavedDirection).sourceHash===key));
}
export function mergeArtDirection(current:SavedDirections,value:unknown):SavedDirections{
 if(!value||typeof value!=='object')return current;
 const record=value as SavedDirection;if(!/^[a-f0-9]{64}$/.test(record.sourceHash)||!record.plans||typeof record.plans!=='object')return current;
 const existing=current[record.sourceHash];if(existing?.plans&&Object.keys(existing.plans).some(id=>!Object.hasOwn(record.plans,id)))return current;
 return {...current,[record.sourceHash]:record};
}
