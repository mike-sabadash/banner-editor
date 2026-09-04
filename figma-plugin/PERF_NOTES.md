# Runtime performance fixes

- Manual fields must not rebuild the accordion DOM on each keystroke.
- Numeric values use ordinary text inputs with numeric inputMode, preserving focus while typing.
- Campaign stats update on animation-frame debounce.
- Campaign-state messages do not rebuild parsed media-plan review.
- `plan-formats-created` does not issue a redundant refresh because the controller posts state itself.
- Figma Inter font is loaded once before batch format creation rather than once per text node.
