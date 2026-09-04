# AI TT Assistant — acceptance flow

The plugin must support a second, AI-assisted path in addition to deterministic media-plan parsing.

1. User can attach several TT source files (`.xlsx`, `.csv`, `.tsv`, `.txt`, `.docx`, `.pdf`).
2. The plugin keeps the sources as a temporary TT knowledge library for the current session. It does not send files to AI until the user explicitly asks for AI matching or verification.
3. User can ask for a concrete target such as `240×400 · Mail.ru · ROS`.
4. OpenRouter analyzes the attached sources and returns only requirements supported by the sources. Missing data stays null/empty; the model must not invent rules.
5. Result shows source file, confidence, evidence, max ZIP, max duration, clickTag requirement, tracking requirement, impression/click/TT URLs when present.
6. User can apply a matched result into Manual Setup as a normal placement. Manual and imported placements keep the same canonical campaign model.
7. User can run AI verification against the current Manual Setup or parsed Media Plan. Verification highlights conflicts/missing TT and proposes source-grounded corrections without silently changing campaign data.
8. Deterministic parsing remains available and is the preferred first pass for clean media plans; AI is used for heterogeneous TT documents and cross-checking.
9. OpenRouter is called through the server gateway; the API key never exists in the Figma plugin.
10. The feature is not DONE until the OpenRouter gateway and the Figma runtime flow are verified end-to-end.
