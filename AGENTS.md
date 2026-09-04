# Banner Editor — Delivery & Verification Rules

These rules are mandatory for all development work in this repository.

## 1. Never collapse delivery states

Every product change has separate states:

- `DESIGNED` — UX/product/technical solution is defined.
- `CODED` — code was actually written.
- `TESTED` — automated/local checks were actually run and their real result is known.
- `PUSHED` — the exact code is present in GitHub; report the real commit SHA.
- `LOCAL` — the user's local working copy has actually received that commit/version.
- `FIGMA VERIFIED` — the complete user scenario was actually run in Figma and passed.

Never describe one state as another. In particular:

- designed != implemented
- code in GitHub != code on the user's Mac
- tests passed != works in Figma
- UI renders != feature works
- parsed file != campaign created

Do not say `done`, `ready`, `fixed`, `implemented`, `works`, or equivalent unless the claimed state is explicitly verified.

## 2. Definition of Done

A product feature is `DONE` only when its complete acceptance scenario has passed runtime verification in Figma.

For Campaign Setup the acceptance scenario is end-to-end:

1. Create/open Campaign Setup.
2. Build the campaign either manually OR by importing a media plan/TT.
3. Manual mode supports arbitrary formats, not a hard-coded quick-start set.
4. Media-plan mode shows the parsing result before canvas creation: placements, unique formats, recognized TT, warnings/conflicts.
5. Requirements remain editable before creation.
6. Requirements can include platform/placement, width/height, max ZIP weight, max duration, clickTag requirement, tracking-pixel requirement, impression pixel URL, click URL and TT/specification URL when supplied.
7. Repeated placements with the same dimensions preserve placement/TT provenance but create one reusable Figma format for that size unless the product requirement explicitly says otherwise.
8. Create Campaign creates the actual requested formats on the Figma canvas.
9. Required tracking-pixel data is preserved for generated formats/placements.
10. Reprocessing/updating the same plan must not create unintended duplicate formats.
11. Adding a new format to an existing campaign creates only the missing format(s).
12. The created dynamic formats remain usable by Creative Editor and granular sync/Motion flows.
13. Runtime result is checked in Figma before the feature is called DONE.

A parser-only success is not Campaign Setup completion.

## 3. One campaign model, two input methods

Manual Setup and Media Plan Import are two ways to populate the same campaign model. Do not build them as unrelated parallel systems.

Canonical flow:

`Campaign -> Placements / Formats -> Technical Requirements -> Review -> Create/Update in Figma -> Creative Editor`

The media-plan parser fills this model automatically. Manual Setup fills it directly. Imported values must remain reviewable/editable before creation.

## 4. Evidence is mandatory

Never invent or infer execution evidence.

When reporting work, provide only evidence that actually exists:

- real branch name
- real commit SHA after a successful push
- real test command and result after it ran
- real build result after it ran
- whether the user's local copy has or has not been updated
- whether Figma runtime has or has not been verified

If a step was not performed, say `NOT VERIFIED` / `NOT LOCAL` rather than guessing.

## 5. User is product owner, not the build pipeline

Do not turn the user into a developer/QA operator through a long sequence of terminal patches.

Preferred workflow:

1. inspect current repository state
2. implement on a dedicated branch
3. run automated checks
4. push and report exact evidence
5. deliver through the smallest safe local update step
6. ask the user to verify the actual product UX/runtime in Figma when local Figma access is required

Terminal commands for the user should be minimal, safe, copy-pasteable, and used only when the assistant cannot perform that local action directly.

## 6. Repository and data safety

Never use destructive operations (`rm -rf`, destructive reset, force overwrite, deleting user files, replacing unknown local state) merely for convenience.

Before any destructive or irreversible action, stop and obtain explicit approval. Preserve unrelated local changes and untracked files.

Do not expose, commit, echo, or document raw secrets, API keys, SSH private keys, passwords, tokens or `.env` values.

## 7. Fix the user scenario, not only the latest symptom

Before changing code, restate internally what complete user outcome the current task belongs to. A bug fix is not complete if the original scenario still cannot finish.

For example, fixing media-plan parsing is insufficient if the user still cannot review TT and create the campaign formats on canvas.

## 8. Runtime regressions

For the Figma plugin:

- keep `documentAccess: dynamic-page` when required by the current manifest/API model
- do not register unnecessary document-wide event listeners
- do not load all document pages unless a feature genuinely requires it
- prefer current-page loading for current-page operations
- startup success and absence of console errors are necessary but not sufficient; the target feature must be exercised

## 9. Reporting format

For implementation updates, report status using this compact block and only mark verified facts:

`DESIGNED: yes/no`
`CODED: yes/no`
`TESTED: yes/no — <actual result>`
`PUSHED: yes/no — <actual SHA if yes>`
`LOCAL: yes/no`
`FIGMA VERIFIED: yes/no`

Then state the next unresolved step. Never hide an unresolved step behind a general statement that the feature is ready.
