const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));

export function calculateFitZoom(currentZoom:number,viewport:{width:number;height:number},selection:{width:number;height:number},padding=48){
 const availableWidth=Math.max(1,viewport.width-padding*2);
 const availableHeight=Math.max(1,viewport.height-padding*2);
 const factor=Math.min(availableWidth/Math.max(1,selection.width),availableHeight/Math.max(1,selection.height),1);
 return clamp(currentZoom*factor,.1,2);
}
