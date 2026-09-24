import {describe,expect,it} from "vitest";
import {FIGMA_ASSET_BRIDGE} from "./featureFlags";
describe("feature flags",()=>{it("keeps Figma Asset Bridge disabled by default",()=>{expect(FIGMA_ASSET_BRIDGE).toBe(false)})});
