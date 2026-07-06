# Project State

## Current Phase

Phase 2: Intake UI.

## Done

- Basic static project structure.
- Pages:
  - Intake Blog
  - Playground
  - Components
- Assets folders:
  - fonts
  - icons
  - images
- Background image.
- Header component.
- HeroContent component.
- GridOverlay component.
- Prompt input.
- Processing button.
- Keywords dropdown with multi-select.
- Voice dropdown with single-select.
- Music dropdown with single-select.
- Length dropdown with single-select.
- Quick prompts with multi-select.
- Shader background with `@paper-design/shaders-react`.
- Vite build for GitHub Pages deployment.
- Playground dark overlay.
- Playground left AI chat scaffold:
  - Generated title from the initial prompt.
  - Logo link back to the main menu.
  - New link back to the main menu.
  - Initial assistant message based on the entry prompt context.
  - Suggested prompt buttons.
  - Message input with disabled empty state and mock AI response.
- Local mantra service mock for initial context, generated title, initial assistant message, and chat replies.
- Playground center mantra workspace:
  - Initial mantra text generated from entry prompt context.
  - Read/Edit mode toggle.
  - Manual edit save/cancel behavior.
  - Copy current mantra text action.
  - Chat prompt mock-refinement updates the displayed mantra.
- Playground right generation settings sidebar:
  - Keyword chips with remove behavior.
  - Settings initialized from the initial setup selections.
  - Keywords, voice, music, and length Change/Done option editing.
  - Mock audio generation creates versioned mantra entries.
  - Generated audio card with playable local WAV preview and working download.
  - Vertical flower thumbnail library restores mantra text, settings, audio, and playback position.
- Playground AI editor API:
  - Vite dev middleware exposes `POST /api/refine-mantra`.
  - Uses OpenAI when `OPENAI_API_KEY` is configured.
  - Falls back to local mock refinement when the API is unavailable.
- Playground speech generation API:
  - Vite dev middleware exposes `POST /api/generate-speech`.
  - Supports OpenAI TTS via `OPENAI_API_KEY`.
  - Supports ElevenLabs TTS via `ELEVENLABS_API_KEY` and configured voice IDs.
  - Browser-side mixer repeats the voice track to the selected duration, adds curated music loops when present, and exports a downloadable WAV.
  - Missing music loop files fall back to procedural background music.

## In Progress

- Matching Intake UI to provided design references.
- Refining interaction states.
- Building Playground UI structure.

## Next

- Review quick prompt layout.
- Add production-quality seamless MP3 loops for Ambient, Nature, and Electronic.
- Add Components sandbox rendering.
- Add responsive behavior for 1440, 1024, and 375 breakpoints.

## Known Gaps

- Fonts are referenced by name but not yet installed in `assets/fonts`.
- Playground chat uses OpenAI-backed refinement only in local/dev sessions with `OPENAI_API_KEY`.
- Playground chat does not persist conversation history yet.
- Playground center workspace uses mock-generated text.
- Playground generated audio requires a configured TTS API key in `.env`; curated music depends on files in `assets/audio/music/`.
- Components page does not yet list available components.
- No automated browser verification yet.
