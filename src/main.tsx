import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import EditorCoreV2 from "./core/EditorCoreV2";
import CampaignHub from "./campaign/CampaignHub";
import CloudAppV2 from "./mvp2/CloudAppV2";
import "./styles.css";
import "./campaign/campaign.css";
import "./campaign/delivery.css";
import "./mvp2/cloud.css";

function Product(){
  const params=new URLSearchParams(location.search);
  if(params.get("view")==="editor")return <EditorCoreV2/>;
  if(params.get("view")==="legacy-campaign")return <CampaignHub/>;
  return <CloudAppV2/>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Product />
  </StrictMode>,
);
