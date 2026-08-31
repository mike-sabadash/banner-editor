import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import EditorCoreV2 from "./core/EditorCoreV2";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <EditorCoreV2 />
  </StrictMode>,
);
