import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("all-formats preview owns a vertical scroll container",()=>{
  const css=readFileSync(new URL("../web-scene/editorProductV2.css",import.meta.url),"utf8");
  assert.match(css,/\.bm-campaign-wall\{[^}]*height:100vh[^}]*overflow-y:auto/);
  assert.match(css,/\.bm-campaign-wall-grid\{[^}]*padding-bottom:48px/);
});

test("off-screen preview cards can skip initial rendering work",()=>{
  const css=readFileSync(new URL("../web-scene/editorProductV2.css",import.meta.url),"utf8");
  assert.match(css,/\.bm-campaign-card\{[^}]*content-visibility:auto[^}]*contain-intrinsic-size:360px/);
});
