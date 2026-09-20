# Editor interaction invariants

These are product rules, not implementation suggestions. Do not change them while fixing unrelated editor behavior.

## Space shortcut context

- The most recently pointer-activated editing surface owns Space.
- Timeline active: Space is Play / Pause. Scrubbing the ruler/playhead, selecting a timeline track, dragging timing or motion handles, or clicking timeline controls activates Timeline.
- Canvas active: holding Space temporarily activates Hand/Pan. Mouse/pointer drag pans the canvas. Releasing Space restores the tool that was active before Space.
- Inspector / properties / other UI does not reinterpret Space and must never move/pan itself because Space is held.
- Hover is not shortcut focus. Moving the pointer over another area must not change Space behavior.
- Clicking Canvas explicitly switches shortcut context back to Canvas.
- Clicking Timeline explicitly switches shortcut context back to Timeline.
- Inputs, textarea, select and contenteditable retain native keyboard behavior.
- Do not infer Space behavior from :hover.
