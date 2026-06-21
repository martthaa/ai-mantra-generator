# AI Mantra Generator

## What This Is

AI Mantra Generator is a frontend prototype for creating personalized AI-generated audio mantras. The current experience starts with an Intake page where the user enters a prompt, chooses settings, and continues to Playground for processing.

## Core Value

The user can quickly describe what they need and configure a personalized mantra experience.

## Requirements

### Validated

- ✓ Static frontend structure exists.
- ✓ Intake page exists.
- ✓ Playground page exists.
- ✓ Components page exists.
- ✓ Header, hero, prompt input, settings, quick prompts, and grid overlay exist.

### Active

- [ ] Finish Intake UI states from visual references.
- [ ] Build Playground processing state.
- [ ] Build Components sandbox.
- [ ] Add responsive behavior for 1920, 1440, 1024, and 375 breakpoints.

### Out of Scope

- Backend generation — deferred until frontend prototype stabilizes.
- Real audio generation — deferred until generation flow is specified.
- Authentication — not needed for the current prototype.
- Payment or account features — not part of MVP prototype.

## Context

The project is currently a simple static HTML/CSS/JS prototype. The user is building iteratively from visual references and prefers precise UI implementation without unrelated content.

Project docs:

- `docs/vision.md`
- `docs/roadmap.md`
- `docs/state.md`
- `docs/memory.md`
- `docs/gsd.md`
- `docs/sdlc.md`

## Constraints

- **Tech stack**: Static HTML/CSS/JS for now — keeps the prototype lightweight.
- **Design**: Match supplied visual references — user is driving visual implementation step by step.
- **Architecture**: Component-based structure — pages should stay thin.
- **Assets**: Use local assets from `assets/`.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use static HTML/CSS/JS first | Fastest prototype path with no dependency overhead | ✓ Good |
| Keep UI as components in `src/components` | Supports scaling and sandboxing | ✓ Good |
| Use `.planning/` for GSD Core | Matches official GSD workflow expectations | — Pending |

---
*Last updated: 2026-06-21 after installing GSD Core*
