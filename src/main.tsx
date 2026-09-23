import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import EditorCoreV2 from "./core/EditorCoreV2";
import CampaignHub from "./campaign/CampaignHub";
import CloudAppV2 from "./mvp2/CloudAppV2";
import BannermaticCloud from "./mvp2/BannermaticCloud";
import BannermaticProduct from "./mvp2/BannermaticProduct";
import AuthPage from "./mvp2/AuthPage";
import CampaignSceneEditor from "./web-scene/CampaignSceneEditor";
import CampaignPreview from "./web-scene/CampaignPreview";
import {hasToken} from "./mvp2/api";
import type {Locale} from "./mvp2/i18n";
import "./styles.css";import "./campaign/campaign.css";import "./campaign/delivery.css";import "./mvp2/design-system.css";import "./mvp2/cloud.css";import "./mvp2/cloud-v2.css";import "./mvp2/marketing.css";import "./mvp2/auth.css";import "./mvp2/design-enforcement.css";import "./mvp2/campaign-wall.css";import "./mvp2/media-plan.css";import "./mvp2/delivery-v2.css";import "./mvp2/figma-connect.css";import "./mvp2/next-elite-shell.css";import "./mvp2/next-elite-public.css";import "./mvp2/next-elite-workspaces.css";import "./mvp2/next-elite-wall.css";import "./mvp2/next-elite-delivery.css";import "./mvp2/viewport.css";import "./web-scene/editorRedesign.css";import "./web-scene/editorUxSystem.css";import "./web-scene/editorAudit20260917.css";import "./mvp2/portfolio-theme.css";

function Product(){
  const params=new URLSearchParams(location.search);
  if(params.get("view")==="scene-editor")return <CampaignSceneEditor/>;
  if(params.get("view")==="campaign-preview")return <CampaignPreview/>;
  if(params.get("view")==="editor")return <EditorCoreV2/>;
  if(params.get("view")==="legacy-campaign")return <CampaignHub/>;
  if(params.get("view")==="mvp2-legacy")return <CloudAppV2/>;
  if(params.get("view")==="mvp2-shell-legacy")return <BannermaticCloud/>;
  const [revision,setRevision]=useState(0);
  const [locale,setLocale]=useState<Locale>(()=>(localStorage.getItem("bannermatic:locale") as Locale)||"ru");
  const chooseLocale=(value:Locale)=>{localStorage.setItem("bannermatic:locale",value);setLocale(value)};
  const invite=params.get("invite")||"";
  const auth=params.get("auth")==="register"?"register":"login";
  const go=(query:string)=>{history.replaceState(null,"",query);setRevision(value=>value+1)};
  const backToPortfolio=()=>{location.href="https://bannermatic.online/"};
  void revision;
  if(invite)return <AuthPage mode="register" inviteToken={invite} locale={locale} onLocale={chooseLocale} onAuthenticated={()=>go("/")} onBack={backToPortfolio}/>;
  if(!hasToken())return <AuthPage mode={auth} locale={locale} onLocale={chooseLocale} onAuthenticated={()=>go("/")} onBack={backToPortfolio}/>;
  return <BannermaticProduct/>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><Product/></StrictMode>);
