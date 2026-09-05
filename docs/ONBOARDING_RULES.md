# Bannermatic MVP2 — Onboarding Rules

This file is a mandatory product contract for Bannermatic MVP2. It must be read together with `MVP2_RULES.md` and `docs/MVP2_CHECKLIST.md` before customer-facing work.

## Core rule

**Onboarding is continuous across the entire product, not a one-time welcome screen.**

Every important stage, branch and state of the customer journey must explain:
- where the user is;
- what this step means;
- what input is expected;
- why the step matters;
- what the next action is;
- what happens after that action;
- what to do when data is missing, invalid, ambiguous or blocked;
- how to recover or go back without losing work.

A first-time user must be able to complete the full Bannermatic journey without external documentation, developer help or prior knowledge of the product.

## Mandatory onboarding coverage

Onboarding must exist across the complete path:

`Marketing → Sign up / Sign in → Workspace → Create Campaign → Manual Setup / Media Plan → TT Review → Campaign Compiler → Connect Figma → Create missing formats → Edit/Animate → Publish Creative → Campaign Wall → Compliance → Fix branches → Delivery Build → Download / completion`

It must also cover all meaningful branches:
- new workspace vs existing workspace;
- first campaign vs existing campaign;
- Manual Setup vs Media Plan import;
- complete TT vs partial TT vs Unknown TT vs conflicting TT;
- one placement vs many placements sharing one format;
- Figma connected vs not connected vs expired pairing;
- missing formats vs already existing formats;
- creative missing vs draft vs published;
- compliance Ready vs Warning vs Blocked;
- fix in Cloud vs fix in Figma;
- build ready vs blocked;
- Owner/Admin/Designer/Producer/Viewer role differences;
- RU and EN;
- desktop/tablet/mobile where the scenario is supported.

## Onboarding patterns

Use the lightest useful pattern for each step. The product may use:
- contextual helper copy;
- first-run coach marks;
- progressive checklists;
- guided empty states;
- inline tips near complex controls;
- step indicators for multi-stage flows;
- clear next-step cards;
- blocking explanations only when the user truly cannot continue;
- recovery instructions for errors;
- “why this matters” explanations for unfamiliar advertising/TT concepts;
- contextual examples that are clearly marked as examples, never fake production data.

Do not overload the user with a giant tutorial before they act. Prefer progressive disclosure: explain the current decision at the moment it becomes relevant.

## Product behavior requirements

1. Every primary screen must have an obvious primary action.
2. Every empty state must teach the user what to do next, not merely say “No data”.
3. Every disabled/blocking state must explain why it is blocked and how to unblock it.
4. Every error must provide a recovery path where one exists.
5. Every multi-step flow must show progress and allow safe back-navigation.
6. Every branch must preserve context so the user understands why the product changed path.
7. Technical terms such as TT, placement, visual format, compliance, clickTag and Campaign Build must be introduced in human language before assuming familiarity.
8. Figma-specific steps must explain exactly what happens in Cloud and what happens in Figma.
9. The product must never require the user to understand GitHub, APIs, internal IDs, server concepts, parser terminology or developer implementation details.
10. Onboarding copy must be localized in RU/EN together with the feature; untranslated helper copy is a defect.

## Persistent guidance model

Onboarding must not disappear forever after one dismissal if the user later reaches a new complex stage. Guidance state should be scoped by feature/stage, not one global `onboardingSeen=true` flag.

Where useful, support:
- “Got it” for local hints;
- “Show me” / guided action;
- “Learn more” for optional detail;
- “Skip for now” only when the user can safely continue;
- a way to reopen relevant guidance later.

Do not trap experienced users in forced tours. Guidance should be strong for first use and lightweight afterward.

## Acceptance rule

No customer-facing checklist item can be marked `DONE` unless its first-time-user path includes appropriate onboarding for:
- normal path;
- empty state;
- loading state;
- validation/error state;
- blocked/permission state where applicable;
- next-step transition.

Final MVP2 acceptance requires a **fresh-user onboarding E2E** proving that a person starting from the marketing page can reach final Campaign Build without external explanation.

## Development rule

When implementing any new screen or branch, onboarding is part of the feature definition, not follow-up polish. The implementation order is:

`feature behavior → onboarding states/copy → tests → deploy → runtime verify`

A feature implemented without its onboarding is incomplete.
