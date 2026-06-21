# GSD Workflow

GSD means Get Shit Done.

This project also has GSD Core installed globally for Codex.

Installed version:

```text
GSD Core v1.5.0
```

Local GSD project files live in:

```text
.planning/
```

Useful GSD skills after restarting Codex:

```text
$gsd-new-project
$gsd-plan-phase 2
$gsd-execute-phase
$gsd-verify-work
$gsd-progress
$gsd-health
```

For this project it means:

```text
Project
-> Roadmap
-> Phase
-> Task
-> Execute
-> Verify
-> Update State
-> Next Task
```

## Rules

- Check `.planning/PROJECT.md`, `.planning/ROADMAP.md`, and `.planning/STATE.md` before larger changes.
- Do not start from code if the intent is unclear.
- Do not move to the next task before verifying the current one.
- Keep tasks small enough to review.
- Update `.planning/STATE.md` and `docs/state.md` after important changes.
- If implementation starts drifting, return to `.planning/PROJECT.md`, `.planning/ROADMAP.md`, `docs/vision.md`, and `docs/roadmap.md`.

## Task Template

```text
Task:
Goal:
Files:
Expected behavior:
Verification:
State update:
```

## Verification Loop

```text
Implement
-> Check syntax
-> Check UI behavior
-> Fix issues
-> Update state
```
