import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import EditorCoreV2 from "./core/EditorCoreV2";
import CampaignHub from "./campaign/CampaignHub";
import "./styles.css";
import "./campaign/campaign.css";

function Product(){
  const params=new URLSearchParams(location.search);
  return params.get("view")==="editor"?<EditorCoreV2/>:<CampaignHub/>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Product />
  </StrictMode>,
);
