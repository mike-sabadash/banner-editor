export const isProjectAsset=(value:string)=>/^\/api\/resize-lab\/assets\/[a-f0-9]{64}\.(png|jpg|webp|svg)$/.test(value);
export class ResizeLabAssetClient{
 private previews=new Map<string,Promise<string>>();private objectUrls=new Set<string>();private disposed=false;
 constructor(private token:string){}
 async preview(source:string,width?:number,height?:number):Promise<string>{
  if(!isProjectAsset(source))return source;
  const url=source+(width&&height?`?w=${Math.round(width*2)}&h=${Math.round(height*2)}`:'');
  if(!this.previews.has(url))this.previews.set(url,(async()=>{
   const response=await fetch(url,{headers:{authorization:'Bearer '+this.token},cache:'default'});
   if(!response.ok)throw Error('Image load failed: '+response.status);
   const blob=await response.blob();
   if(this.disposed)return '';
   const objectUrl=URL.createObjectURL(blob);this.objectUrls.add(objectUrl);return objectUrl;
  })().catch(error=>{this.previews.delete(url);throw error;}));
  return this.previews.get(url)!;
 }
 async original(source:string):Promise<string>{
  if(!isProjectAsset(source))return source;
  const response=await fetch(source,{headers:{authorization:'Bearer '+this.token},cache:'default'});
  if(!response.ok)throw Error('Original image unavailable: '+response.status);
  const blob=await response.blob();
  return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('Image read failed'));reader.readAsDataURL(blob)});
 }
 activate(){this.disposed=false;}
 dispose(){this.disposed=true;for(const url of this.objectUrls)URL.revokeObjectURL(url);this.objectUrls.clear();this.previews.clear();}
}
export const previewKey=(source:string,width?:number,height?:number)=>source+(width&&height?`:${width}x${height}`:'');
