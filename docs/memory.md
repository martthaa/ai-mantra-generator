# Memory

## User Preferences

- User prefers working from visual references.
- User wants frontend architecture to stay component-based.
- User prefers precise implementation of supplied design specs.
- User does not want unrelated content added.
- User works iteratively and adjusts UI states step by step.

## Product Preferences

- The product is an AI mantra prototype.
- The experience should support personal prompt input.
- Settings include:
  - Keywords
  - Voice
  - Music
  - Length
- Keywords can be multi-select.
- Quick prompts can be multi-select.
- Voice, Music, and Length are currently single-select.

## UI Preferences

- Use provided assets from `assets`.
- Use supplied SVG icons when available.
- Keep settings as pills.
- Selected/configured setting pills need a visible state.
- Settings should support hover, active, selected, and clear states.

## Engineering Preferences

- Prefer simple static HTML/CSS/JS while the prototype is early.
- Keep components isolated in `src/components`.
- Keep state logic near the owning component until shared state is needed.
