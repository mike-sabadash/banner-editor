// A normal rollout only fills missing outputs. Existing artwork, including an
// accepted image retained after a failed retry, is never an implicit paid target.
export function missingRolloutFormats<T extends {id:string}>(formats:T[],results:Record<string,{image?:string}|undefined>){return formats.filter(f=>!results[f.id]?.image);}
