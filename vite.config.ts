import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { layoutDirectorMiddleware } from "./server/layoutDirector";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  if (env.GEMINI_LAYOUT_MODEL) process.env.GEMINI_LAYOUT_MODEL = env.GEMINI_LAYOUT_MODEL;

  return {
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
