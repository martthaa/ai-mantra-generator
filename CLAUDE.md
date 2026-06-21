# AI Orchestration

## Role

This file is the orchestration layer for AI agents working on the project.

## Project

AI Mantra Generator prototype.

The current focus is the frontend prototype for:

- Intake Blog
- Playground
- Components sandbox

## Operating Model

Work should follow this loop:

```text
Understand context
-> Check roadmap
-> Pick current task
-> Implement
-> Verify
-> Update state
```

## Principles

- Use existing project structure before adding new patterns.
- Keep UI work component-based.
- Avoid adding unrelated content.
- Keep design implementation close to the provided Figma references.
- Verify each change before moving to the next one.
- Update project state after meaningful progress.

## Source Of Truth

- `.planning/PROJECT.md` defines GSD project context.
- `.planning/REQUIREMENTS.md` defines testable requirements.
- `.planning/ROADMAP.md` defines GSD phases.
- `.planning/STATE.md` tracks GSD progress.
- `docs/vision.md` defines what the product is.
- `docs/roadmap.md` defines phases.
- `docs/state.md` tracks current progress.
- `docs/memory.md` stores project/user preferences.
- `docs/gsd.md` defines execution workflow.
- `docs/sdlc.md` defines lifecycle workflow.
- `AGENTS.md` defines agent responsibilities.
