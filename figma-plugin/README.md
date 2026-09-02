# Banner Campaign Figma Plugin MVP

1. In Figma Desktop open **Plugins → Development → Import plugin from manifest**.
2. Select `figma-plugin/manifest.json`.
3. Run **Banner Campaign MVP** and create the five format components.
4. Edit each format independently. Assign stable campaign slots to reusable layers.
5. Animate supported properties in Figma Motion: translation, scale, rotation and opacity.
6. Export `.figma-campaign.json` and open it through **Open** in Banner Editor.

The exchange format preserves editable text/image layers, local geometry, slot linkage, duration and supported Motion keyframes. Unsupported visual nodes are rasterized per layer. Motion API support is currently beta in Figma, so the exporter intentionally uses a limited production-safe subset.
