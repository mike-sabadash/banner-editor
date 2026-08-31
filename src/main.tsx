import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Editor from "./Editor";
import { bootstrapProjectPersistence, installEditorRuntime } from "./editorRuntime";
import "./styles.css";
import "./enhancements.css";

await bootstrapProjectPersistence();
createRoot(document.getElementById("root")!).render(<StrictMode><Editor /></StrictMode>);
installEditorRuntime();
