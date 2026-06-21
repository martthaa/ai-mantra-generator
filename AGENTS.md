# Agent Responsibilities

## Frontend Architect

Owns project structure, component boundaries, page architecture, reusable UI patterns, and scalability.

Responsibilities:

- Maintain component-based structure.
- Keep pages thin.
- Keep shared configuration in `src/config`.
- Keep assets in `assets`.
- Prevent duplicated UI logic.

## UI Implementation Agent

Owns visual implementation from design references.

Responsibilities:

- Match spacing, sizing, typography, colors, and states from provided references.
- Implement default, hover, active, selected, and configured states.
- Keep components inspectable and isolated.
- Avoid unrelated visual invention.

## Interaction Agent

Owns UI behavior.

Responsibilities:

- Implement dropdown behavior.
- Implement multi-select and single-select logic.
- Implement input behavior.
- Implement navigation from Intake to Playground.
- Preserve accessibility basics such as button semantics and `aria-pressed`.

## QA Agent

Owns verification.

Responsibilities:

- Check syntax.
- Check that pages load.
- Check that components do not regress after changes.
- Check interaction states.
- Report known gaps in `docs/state.md`.

## Product Context Agent

Owns product continuity.

Responsibilities:

- Keep `docs/vision.md`, `docs/memory.md`, and `docs/roadmap.md` aligned.
- Prevent AI slop by keeping implementation tied to product intent.
- Convert vague ideas into specs before implementation.
