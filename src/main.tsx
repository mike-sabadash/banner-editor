import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Editor from "./Editor";
import { bootstrapProjectPersistence, installEditorRuntime } from "./editorRuntime";
import EditorCoreV2 from "./core/EditorCoreV2";
import CampaignHub from "./campaign/CampaignHub";
import CloudAppV2 from "./mvp2/CloudAppV2";
import BannermaticCloud from "./mvp2/BannermaticCloud";
import CampaignSceneEditor from "./web-scene/CampaignSceneEditor";
import CampaignPreview from "./web-scene/CampaignPreview";
import "./styles.css";import "./campaign/campaign.css";import "./campaign/delivery.css";import "./mvp2/design-system.css";import "./mvp2/cloud.css";import "./mvp2/cloud-v2.css";import "./mvp2/marketing.css";import "./mvp2/auth.css";import "./mvp2/design-enforcement.css";import "./mvp2/campaign-wall.css";import "./mvp2/media-plan.css";import "./mvp2/delivery-v2.css";import "./mvp2/figma-connect.css";import "./mvp2/next-elite-shell.css";import "./mvp2/next-elite-public.css";import "./mvp2/next-elite-workspaces.css";import "./mvp2/next-elite-wall.css";import "./mvp2/next-elite-delivery.css";import "./mvp2/viewport.css";import "./web-scene/editorRedesign.css";import "./web-scene/editorUxSystem.css";import "./web-scene/editorAudit20260917.css";import "./mvp2/portfolio-theme.css";

function Product(){
  const params=new URLSearchParams(location.search);
  if(params.get("view")==="scene-editor")return <CampaignSceneEditor/>;
  if(params.get("view")==="campaign-preview")return <CampaignPreview/>;
  if(params.get("view")==="editor")return <EditorCoreV2/>;
  if(params.get("view")==="legacy-campaign")return <CampaignHub/>;
  if(params.get("view")==="mvp2-legacy")return <CloudAppV2/>;
  if(params.get("view")==="mvp2-shell-legacy")return <BannermaticCloud/>;
  return <Editor/>;
}

await bootstrapProjectPersistence();
createRoot(document.getElementById("root")!).render(<StrictMode><Product/></StrictMode>);
installEditorRuntime();
