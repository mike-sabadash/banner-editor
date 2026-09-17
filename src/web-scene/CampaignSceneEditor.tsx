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
  const [sceneDocumentState,setSceneDocumentState]=useState<"loading"|"loaded"|"unavailable">("loading");

  const load=useCallback(async()=>{
    if(!campaignId){setError("Campaign id is missing");setLoading(false);return}
    setLoading(true);setError("");setSceneDocumentState("loading");
    try{
      const meta=await api.campaignMeta(campaignId);
      setCampaign(meta);
      setLoading(false);
      try{
        const {creativeDocument}=await api.sceneDocument(campaignId);
        if(creativeDocument)setCampaign(current=>current?{...current,creativeDocument}:current);
        setSceneDocumentState("loaded");
      }catch(e){
        console.warn("Could not load scene document; editor opened with campaign metadata",e);
        setSceneDocumentState("unavailable");
      }
    }catch(e){
      setError(e instanceof Error?e.message:String(e));setLoading(false);setSceneDocumentState("unavailable");
    }
  },[campaignId,attempt]);

  useEffect(()=>{let alive=true;void (async()=>{if(alive)await load()})();return()=>{alive=false}},[load]);
  const retry=()=>setAttempt(value=>value+1);

  if(error)return <main className="bm-editor-load-state bm-editor-load-error"><section><small>BANNERMATIC</small><h2>Could not open campaign</h2><p>{error}</p><div><button className="bm-button primary" onClick={retry}>Retry</button><button className="bm-button" onClick={()=>location.href="/"}>Back to campaigns</button></div></section></main>;
  if(loading&&!campaign)return <main className="bm-editor-load-state"><section><span className="bm-editor-loader"/><small>BANNERMATIC</small><h2>Opening creative editor</h2><p>Loading campaign and creative document…</p></section></main>;
  if(!campaign)return null;

  // Campaign metadata arrives first so the editor opens quickly. When the saved scene
  // document follows, remount exactly once from that authoritative document instead of
  // leaving the editor on DEFAULT_SCENES for the rest of the session.
  const editorKey=`${campaign.id}:${campaign.creativeDocument?.updatedAt||sceneDocumentState}`;
  return <><WebSceneEditor key={editorKey} campaign={campaign}/><CampaignFonts campaign={campaign} onCampaign={setCampaign}/>{sceneDocumentState==="loading"&&<div className="bm-editor-hydration-status">Loading saved creative…</div>}{sceneDocumentState==="unavailable"&&<button className="bm-editor-hydration-status warning" onClick={retry}>Saved creative unavailable · Retry</button>}</>;
}
