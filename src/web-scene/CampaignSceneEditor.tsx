import {useEffect,useState} from "react";
import {api} from "../mvp2/api";
import type {Campaign} from "../mvp2/domain";
import WebSceneEditor from "./WebSceneEditor";
import CampaignFonts from "./CampaignFonts";

export default function CampaignSceneEditor(){
  const campaignId=new URLSearchParams(location.search).get("campaignId")||"";
  const [campaign,setCampaign]=useState<Campaign|null>(null);
  const [error,setError]=useState("");
  useEffect(()=>{let alive=true;if(!campaignId){setError("Campaign id is missing");return}const timeout=window.setTimeout(()=>alive&&setError("Campaign is taking too long to load. Please retry."),15000);void api.campaign(campaignId).then(c=>{window.clearTimeout(timeout);if(alive)setCampaign(c)}).catch(e=>{window.clearTimeout(timeout);if(alive)setError(e instanceof Error?e.message:String(e))});return()=>{alive=false;window.clearTimeout(timeout)}},[campaignId]);
  if(error)return <main style={{padding:32,fontFamily:"Inter,system-ui",background:"#0b0d10",color:"white",minHeight:"100vh"}}><h2>Could not open campaign</h2><p>{error}</p><button onClick={()=>location.reload()}>Retry</button> <button onClick={()=>location.href="/"}>Back to campaigns</button></main>;
  if(!campaign)return <main style={{padding:32,fontFamily:"Inter,system-ui",background:"#0b0d10",color:"white",minHeight:"100vh"}}>Loading campaign…</main>;
  return <><WebSceneEditor campaign={campaign}/><CampaignFonts campaign={campaign} onCampaign={setCampaign}/></>;
}
