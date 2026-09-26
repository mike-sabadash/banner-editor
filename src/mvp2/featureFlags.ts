/** Figma Asset Bridge feature flag. Disabled unless explicitly enabled at build time. */
export const FIGMA_ASSET_BRIDGE=(import.meta as any).env?.VITE_FIGMA_ASSET_BRIDGE==="true";
