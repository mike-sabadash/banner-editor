import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { layoutDirectorMiddleware } from "./server/layoutDirector";

export default defineConfig({
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
});
