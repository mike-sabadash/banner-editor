import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import EditorCoreV2 from "./core/EditorCoreV2";
import CampaignHub from "./campaign/CampaignHub";
import CloudAppV2 from "./mvp2/CloudAppV2";
import BannermaticCloud from "./mvp2/BannermaticCloud";
import BannermaticProduct from "./mvp2/BannermaticProduct";
import MarketingHome from "./mvp2/MarketingHome";
import AuthPage from "./mvp2/AuthPage";
import {hasToken} from "./mvp2/api";
import type {Locale} from "./mvp2/i18n";
import "./styles.css";import "./campaign/campaign.css";import "./campaign/delivery.css";import "./mvp2/design-system.css";import "./mvp2/cloud.css";import "./mvp2/cloud-v2.css";import "./mvp2/marketing.css";import "./mvp2/auth.css";import "./mvp2/design-enforcement.css";import "./mvp2/campaign-wall.css";import "./mvp2/media-plan.css";import "./mvp2/delivery-v2.css";import "./mvp2/figma-connect.css";import "./mvp2/next-elite-shell.css";import "./mvp2/next-elite-public.css";import "./mvp2/next-elite-workspaces.css";

function Product(){
  const params=new URLSearchParams(location.search);
  if(params.get("view")==="editor")return <EditorCoreV2/>;
  if(params.get("view")==="legacy-campaign")return <CampaignHub/>;
  if(params.get("view")==="mvp2-legacy")return <CloudAppV2/>;
  if(params.get("view")==="mvp2-shell-legacy")return <BannermaticCloud/>;
  const [revision,setRevision]=useState(0);
  const [locale,setLocale]=useState<Locale>(()=>(localStorage.getItem("bannermatic:locale") as Locale)||"en");
  const chooseLocale=(value:Locale)=>{localStorage.setItem("bannermatic:locale",value);setLocale(value)};
  const invite=params.get("invite")||"";
  const auth=params.get("auth")==="register"?"register":params.get("auth")==="login"?"login":null;
  const go=(query:string)=>{history.replaceState(null,"",query);setRevision(v=>v+1)};
  void revision;
  if(invite)return <AuthPage mode="register" inviteToken={invite} locale={locale} onLocale={chooseLocale} onAuthenticated={()=>go("/")} onBack={()=>go("/")}/>;
  if(!hasToken()&&auth)return <AuthPage mode={auth} locale={locale} onLocale={chooseLocale} onAuthenticated={()=>go("/")} onBack={()=>go("/")}/>;
  if(!hasToken())return <MarketingHome locale={locale} onLocale={chooseLocale} onSignIn={()=>go("?auth=login")} onStart={()=>go("?auth=register")}/>;
  return <BannermaticProduct/>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><Product /></StrictMode>);
