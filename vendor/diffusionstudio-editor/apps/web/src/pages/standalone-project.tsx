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

const standaloneProject = {
  id: 'bannermatic-diffusion-browser',
  name: 'Bannermatic',
  displayName: 'Bannermatic',
  dir: '__browser_standalone__',
  entry: 'index.tsx',
  modifiedAt: new Date(0).toISOString(),
  createdAt: new Date(0).toISOString(),
};

export function StandaloneProjectPage() {
  return (
    <ProjectProvider project={standaloneProject}>
      <EngineProvider projectId={standaloneProject.id}>
        <EditorApiProvider>
          <TimelineProvider>
            <ExportProvider>
              <PromptInputProvider>
                <LayoutProvider>
                  <EditorPage standalone />
                </LayoutProvider>
              </PromptInputProvider>
            </ExportProvider>
          </TimelineProvider>
        </EditorApiProvider>
      </EngineProvider>
    </ProjectProvider>
  );
}
