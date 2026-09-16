import {useCallback,useEffect,useState} from "react";
import {api} from "../mvp2/api";
import type {Campaign} from "../mvp2/domain";
import WebSceneEditor from "./WebSceneEditor";
import CampaignFonts from "./CampaignFonts";

export default function CampaignSceneEditor(){
  const campaignId=new URLSearchParams(location.search).get("campaignId")||"";
  const [campaign,setCampaign]=useState<Campaign|null>(null);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  const [attempt,setAttempt]=useState(0);
  const load=useCallback(async()=>{
    if(!campaignId){setError("Campaign id is missing");setLoading(false);return}
    setLoading(true);setError("");
    try{
      // The editor can render from campaign metadata immediately. The scene document
      // is optional and may be slow for older/heavier campaigns, so do not block the UI on it.
      const meta=await api.campaignMeta(campaignId);
      setCampaign(meta);
      setLoading(false);
      try{
        const {creativeDocument}=await api.sceneDocument(campaignId);
        if(creativeDocument)setCampaign(current=>current?{...current,creativeDocument}:current);
      }catch(e){
        console.warn("Could not load scene document; editor opened with campaign metadata",e);
      }
    }catch(e){
      setError(e instanceof Error?e.message:String(e));setLoading(false);
    }
  },[campaignId,attempt]);
  useEffect(()=>{let alive=true;void (async()=>{if(alive)await load()})();return()=>{alive=false}},[load]);
  const retry=()=>setAttempt(value=>value+1);
  if(error)return <main style={{padding:32,fontFamily:"Inter,system-ui",background:"#0b0d10",color:"white",minHeight:"100vh"}}><h2>Could not open campaign</h2><p>{error}</p><button onClick={retry}>Retry</button> <button onClick={()=>location.href="/"}>Back to campaigns</button></main>;
  if(loading&&!campaign)return <main style={{padding:32,fontFamily:"Inter,system-ui",background:"#0b0d10",color:"white",minHeight:"100vh"}}>Loading campaign…</main>;
  if(!campaign)return null;
  return <><WebSceneEditor campaign={campaign}/><CampaignFonts campaign={campaign} onCampaign={setCampaign}/></>;
}
