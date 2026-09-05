import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import EditorCoreV2 from "./core/EditorCoreV2";
import CampaignHub from "./campaign/CampaignHub";
import CloudAppV2 from "./mvp2/CloudAppV2";
import MarketingHome from "./mvp2/MarketingHome";
import {hasToken} from "./mvp2/api";
import type {Locale} from "./mvp2/i18n";
import "./styles.css";
import "./campaign/campaign.css";
import "./campaign/delivery.css";
import "./mvp2/design-system.css";
import "./mvp2/cloud.css";
import "./mvp2/marketing.css";

function Product(){
  const params=new URLSearchParams(location.search);
  if(params.get("view")==="editor")return <EditorCoreV2/>;
  if(params.get("view")==="legacy-campaign")return <CampaignHub/>;
  const [enterApp,setEnterApp]=useState(()=>hasToken()||params.get("auth")!==null);
  const [locale,setLocale]=useState<Locale>(()=>(localStorage.getItem("bannermatic:locale") as Locale)||"en");
  const chooseLocale=(value:Locale)=>{localStorage.setItem("bannermatic:locale",value);setLocale(value)};
  if(!enterApp&&!hasToken())return <MarketingHome locale={locale} onLocale={chooseLocale} onSignIn={()=>{history.replaceState(null,"","?auth=login");setEnterApp(true)}} onStart={()=>{history.replaceState(null,"","?auth=register");setEnterApp(true)}}/>;
  return <CloudAppV2/>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Product />
  </StrictMode>,
);
