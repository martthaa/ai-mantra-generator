# AI Mantra Generator

## Demo

[Open demo](https://martthaa.github.io/ai-mantra-generator/)

## Цілі проекту

- Створити масштабовану структуру для AI Mantra Generator.
- Підготувати окремі сторінки для Intake, Playground та Components.
- Забезпечити компонентний підхід до побудови інтерфейсу.
- Додати технічну основу для перевірки UI-компонентів у sandbox-середовищі.
- Додати 8-колоночну сітку для брейкпоінта 1920px з можливістю увімкнення та вимкнення.

## Сторінки

- `index.html` — Intake.
- `playground.html` — Playground.
- `components.html` — Components.

## Commands

- `npm run dev` — local development server.
- `npm run build` — production build.
- `npm run preview` — preview production build.

## Структура

```text
assets/
  fonts/
  icons/
  images/
src/
  components/
    GridOverlay/
  config/
  pages/
  styles/
```

## Брейкпоінти

- `1920px`
- `1440px`
- `1024px`
- `375px`

## Принципи

- Сторінки не містять наповнення за замовчуванням.
- Компоненти ізолюються в окремих папках.
- Кожен компонент має власний JavaScript і CSS-файл.
- Сторінка `Components` використовується як вітрина та sandbox для наявних компонентів.
- Глобальні стилі містять лише базові змінні, reset і системні підключення.
- Асети зберігаються в кореневій папці `assets`.

## AI Workflow

- `.planning/PROJECT.md` — GSD Core project context.
- `.planning/REQUIREMENTS.md` — GSD Core requirements.
- `.planning/ROADMAP.md` — GSD Core roadmap.
- `.planning/STATE.md` — GSD Core state.
- `.planning/config.json` — local GSD workflow config.
- `CLAUDE.md` — orchestration layer for AI agents.
- `AGENTS.md` — responsibilities for different agent roles.
- `docs/vision.md` — product vision.
- `docs/roadmap.md` — phased execution plan.
- `docs/state.md` — current project state.
- `docs/memory.md` — persistent preferences and context.
- `docs/gsd.md` — execution workflow.
- `docs/sdlc.md` — development lifecycle.
