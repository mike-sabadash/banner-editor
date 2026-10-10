export type ButtonVariant="solid"|"outline"|"ghost";
export type TypeStyle={headlineFont:string;sublineFont:string;ctaFont:string;logoFont:string;headlineSize:number;sublineSize:number;ctaSize:number;headlineColor:string;sublineColor:string;ctaColor:string;buttonColor:string;buttonVariant:ButtonVariant;buttonRadius:number};
export const defaultTypeStyle:TypeStyle={headlineFont:"Inter",sublineFont:"Inter",ctaFont:"Inter",logoFont:"Inter",headlineSize:100,sublineSize:100,ctaSize:100,headlineColor:"#ffffff",sublineColor:"#ffffff",ctaColor:"#ffffff",buttonColor:"#2563eb",buttonVariant:"solid",buttonRadius:8};
export const fontFamilies=["Inter","Roboto","Open Sans","Montserrat","Poppins","Lato","Nunito Sans","Oswald","Raleway","Rubik","Manrope","DM Sans","Work Sans","Source Sans 3","PT Sans","Noto Sans","Ubuntu","Mulish","Barlow","Archivo","Plus Jakarta Sans","Outfit","Space Grotesk","IBM Plex Sans","Roboto Condensed","Merriweather","Playfair Display","Lora","PT Serif","Roboto Slab","Bebas Neue","Anton","Exo 2","Fira Sans","Comfortaa","Caveat","Pacifico"];

export function restoreTypeStyle(value:Partial<TypeStyle>&{font?:string}={}):TypeStyle{
 const result={...defaultTypeStyle,...value};
 for(const key of ['headlineFont','sublineFont','ctaFont','logoFont'] as const){const font=value[key]||(key==='logoFont'?'Inter':value.font)||'Inter';result[key]=fontFamilies.includes(font)?font:'Inter'}
 return result;
}
