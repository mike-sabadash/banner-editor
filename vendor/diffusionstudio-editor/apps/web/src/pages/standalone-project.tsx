/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { EditorPage } from './editor';
import { LayoutProvider } from "@/context/layout";
import { PromptInputProvider } from "@/context/prompt-input";
import { EditorApiProvider } from '@/dapi';
import { ExportProvider } from '@/context/export';
import { ProjectProvider } from '@/context/project';
import { TimelineProvider } from '@/context/timeline';
import { EngineProvider } from '@/engine';
import {Show,createMemo,createResource} from 'solid-js';
import {CampaignProductionPanel} from '@/bannermatic/campaign-production-panel';
import {buildCampaignBundle,loadCampaign,loadCampaignBundleRecord,saveCampaignBundle,type BannermaticCampaign} from '@/bannermatic/campaign';
import '@/bannermatic/campaign.css';
import '@/bannermatic/campaign-interactions.css';
import '@/bannermatic/campaign-loading.css';
import {loadProjectBundleRecord,rememberProjectBundle} from '@/lib/db';
import {decodeStandaloneBundle} from '@/projects/standalone-model';
import {restoreBrowserProjectFS} from '@/projects/fs';

const projectFor=(campaign?:BannermaticCampaign)=>({id:campaign?`bannermatic-campaign-${campaign.id}`:'bannermatic-diffusion-browser',name:campaign?.name||'Bannermatic',displayName:campaign?.name||'Bannermatic',dir:'__browser_standalone__',entry:'index.tsx',modifiedAt:new Date(0).toISOString(),createdAt:new Date(0).toISOString()});

function EditorShell(props:{campaign?:BannermaticCampaign;onCampaign?:(value:BannermaticCampaign)=>void}){const preferred=new URLSearchParams(location.search).get('formatId')||'',project=createMemo(()=>projectFor(props.campaign)),[bundle]=createResource(()=>props.campaign?.id,async()=>{const local=await loadProjectBundleRecord(project().id),remote=await loadCampaignBundleRecord(props.campaign!.id).catch(()=>({bundle:'',updatedAt:null})),localIsNewer=Boolean(local?.code&&(!remote.bundle||!remote.updatedAt||local.updatedAt>remote.updatedAt)),saved=localIsNewer?local!.code:remote.bundle||local?.code||'',next=buildCampaignBundle(props.campaign!,preferred,saved),model=decodeStandaloneBundle(next);restoreBrowserProjectFS(`__browser_standalone__:${project().id}`,model?.assets);await rememberProjectBundle(project().id,next);await saveCampaignBundle(props.campaign!.id,next);return next});const content=()=>props.campaign?bundle():undefined;return <Show when={!props.campaign||content()} fallback={<main class="bm-campaign-loading"><div><b>B</b><h1>Opening creative…</h1><p>Restoring the editable campaign document.</p></div></main>}><ProjectProvider project={project()}><EngineProvider projectId={project().id}><EditorApiProvider><TimelineProvider><ExportProvider><PromptInputProvider><LayoutProvider><EditorPage standalone standaloneBundle={content()}/><Show when={props.campaign}>{campaign=><CampaignProductionPanel campaign={campaign()} projectId={project().id} onCampaign={value=>props.onCampaign?.(value)}/>}</Show></LayoutProvider></PromptInputProvider></ExportProvider></TimelineProvider></EditorApiProvider></EngineProvider></ProjectProvider></Show>}

export function StandaloneProjectPage() {
  const campaignId=new URLSearchParams(location.search).get('campaignId')||'';
  const [campaign,{mutate}]=createResource(()=>campaignId||undefined,loadCampaign);
  if(!campaignId)return <EditorShell/>;
  return <Show when={campaign()} fallback={<main class="bm-campaign-loading"><div><b>B</b><h1>{campaign.error?'Campaign cannot be opened':'Loading campaign…'}</h1><p>{campaign.error instanceof Error?campaign.error.message:'Media plan, formats and TT requirements are being connected to Diffusion.'}</p><Show when={campaign.error}><a href="/">Back to Bannermatic</a></Show></div></main>}>{value=><EditorShell campaign={value()} onCampaign={mutate}/>}</Show>;
}
