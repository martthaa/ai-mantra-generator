# Requirements: AI Mantra Generator

**Defined:** 2026-06-21
**Core Value:** The user can quickly describe what they need and configure a personalized mantra experience.

## v1 Requirements

### Intake

- [ ] **INTAKE-01**: User can enter a mantra prompt.
- [ ] **INTAKE-02**: User can select multiple keywords.
- [ ] **INTAKE-03**: User can select one voice.
- [ ] **INTAKE-04**: User can select one music option.
- [ ] **INTAKE-05**: User can select one length option.
- [ ] **INTAKE-06**: User can select multiple quick prompt examples.
- [ ] **INTAKE-07**: User can clear configured settings from setting pills.
- [ ] **INTAKE-08**: User can start processing after entering or selecting prompt content.

### Playground

- [ ] **PLAY-01**: User is routed to Playground after processing starts.
- [ ] **PLAY-02**: Playground can read the intake prompt from session state.
- [ ] **PLAY-03**: Playground shows a processing state.
- [ ] **PLAY-04**: Playground has a placeholder for generated mantra output.

### Components

- [ ] **COMP-01**: Components page displays available components.
- [ ] **COMP-02**: Components page acts as UI sandbox.
- [ ] **COMP-03**: Components page exposes component states for review.

### Layout

- [ ] **LAYOUT-01**: Project supports 1920px breakpoint.
- [ ] **LAYOUT-02**: Project supports 1440px breakpoint.
- [ ] **LAYOUT-03**: Project supports 1024px breakpoint.
- [ ] **LAYOUT-04**: Project supports 375px breakpoint.
- [ ] **LAYOUT-05**: 8-column grid overlay can be toggled.

## v2 Requirements

### Generation

- **GEN-01**: Generate mantra text from user prompt and settings.
- **GEN-02**: Generate or synthesize mantra audio.
- **GEN-03**: Add music or soundscape layer.
- **GEN-04**: Export or share generated mantra.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Authentication | Not needed for current prototype |
| Payments | Not needed until MVP value is validated |
| Backend AI integration | Frontend flow is not complete yet |
| Real audio rendering | Requires separate research and API decisions |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INTAKE-01 | Phase 2 | In Progress |
| INTAKE-02 | Phase 2 | In Progress |
| INTAKE-03 | Phase 2 | In Progress |
| INTAKE-04 | Phase 2 | In Progress |
| INTAKE-05 | Phase 2 | In Progress |
| INTAKE-06 | Phase 2 | In Progress |
| INTAKE-07 | Phase 2 | In Progress |
| INTAKE-08 | Phase 2 | In Progress |
| PLAY-01 | Phase 3 | Pending |
| PLAY-02 | Phase 3 | Pending |
| PLAY-03 | Phase 3 | Pending |
| PLAY-04 | Phase 3 | Pending |
| COMP-01 | Phase 4 | Pending |
| COMP-02 | Phase 4 | Pending |
| COMP-03 | Phase 4 | Pending |
| LAYOUT-01 | Phase 2 | In Progress |
| LAYOUT-02 | Phase 6 | Pending |
| LAYOUT-03 | Phase 6 | Pending |
| LAYOUT-04 | Phase 6 | Pending |
| LAYOUT-05 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0

---
*Requirements defined: 2026-06-21*
*Last updated: 2026-06-21 after installing GSD Core*
