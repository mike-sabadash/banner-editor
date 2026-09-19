import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { layoutDirectorMiddleware } from "./server/layoutDirector";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const serverEnvKeys = [
    "OPENROUTER_API_KEY",
    "OPENROUTER_LAYOUT_MODEL",
    "OPENROUTER_SITE_URL",
    "OPENROUTER_APP_NAME",
    "GEMINI_API_KEY",
    "GEMINI_LAYOUT_MODEL",
  ] as const;

  for (const key of serverEnvKeys) {
    if (env[key]) process.env[key] = env[key];
  }

  return {
    server: {host: "0.0.0.0", allowedHosts: ["terminal.local"], proxy: {"/api": {target: env.BANNERMATIC_DEV_GATEWAY || process.env.BANNERMATIC_DEV_GATEWAY || "http://127.0.0.1:8791", changeOrigin: true}}},
    preview: {
      allowedHosts: ["banners.rechord.online"],
    },
    plugins: [
      react(),
      {
        name: "layout-director-api",
        configureServer(server) {
          server.middlewares.use(layoutDirectorMiddleware());
        },
        configurePreviewServer(server) {
          server.middlewares.use(layoutDirectorMiddleware());
        },
      },
    ],
  };
});

