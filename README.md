# ADA Debate Timer

[Versión en español](README.es.md) | [Open live application](https://cronometro-ada.vercel.app/)

A projection-ready web timer designed and built as a personal project for the **Alicante Debate Association (ADA)**. It supports Academic and British Parliamentary debate formats, configurable timings, phase navigation, keyboard operation, and persistent local settings.

> The interface is in Spanish because the application was created for ADA's speakers, judges, and tournament staff in Alicante.

## Why This Project

Debate sessions contain many timed interventions with different speakers, durations, and rules. A generic stopwatch forces organizers to track that sequence separately and is difficult to read when projected in a room.

ADA Debate Timer combines the complete running order with a large-format countdown. It lets the operator configure a debate once, move safely between phases, and keep the current speaker and remaining time visible to everyone.

## Features

- **Two debate formats:** configurable Academic Debate and eight-speech British Parliamentary.
- **Projection-ready display:** large responsive timer, current speaker, phase progress, and clear visual states.
- **Overtime tracking:** continues below zero instead of stopping when an intervention runs over time.
- **Visual warnings:** changes to yellow during the final 10 seconds and red after 10 seconds of overtime.
- **Flexible configuration:** team names, speech durations, number of rebuttal rounds, shorter final rebuttals, deliberation, and feedback.
- **Phase control:** previous, next, and direct phase navigation, disabled while the timer is running to prevent accidental changes.
- **Interactive timeline:** click, drag, or touch the progress bar to adjust the current phase.
- **Keyboard-first operation:** shortcuts for timing, navigation, configuration, format selection, and theme switching.
- **Responsive interface:** designed for projectors, laptops, tablets, and mobile devices.
- **Persistent preferences:** configuration and theme are stored in the browser with `localStorage`; no account or backend is required.
- **Adaptive theme:** light and dark modes with system-preference detection.

## Supported Formats

### Academic Debate

The Academic format generates the full sequence from configurable values:

1. Introduction by Team A and cross-examination.
2. Introduction by Team B and cross-examination.
3. Alternating rebuttal rounds for both teams.
4. Conclusion by Team B followed by Team A.
5. Judges' deliberation and feedback.

Default timings are 4-minute introductions, 2-minute cross-examinations, three 5-minute rebuttal rounds with an optional 90-second final round, and 3-minute conclusions.

### British Parliamentary

The British Parliamentary format includes the standard eight speeches:

1. Prime Minister
2. Leader of the Opposition
3. Deputy Prime Minister
4. Deputy Leader of the Opposition
5. Member of Government
6. Member of the Opposition
7. Government Whip
8. Opposition Whip

Speech duration defaults to 7 minutes. Team names are configurable for the opening and closing government and opposition benches. Deliberation and feedback phases are included after the speeches.

## Architecture

The application uses framework-free JavaScript modules. UI components communicate through a small event bus, keeping the timer engine, phase generation, browser storage, and DOM rendering independent. Debate formats are self-describing modules held in a `FormatRegistry`; the configuration form, format selector, keyboard shortcuts and help panel are generated from it (see [Adding a Debate Format](#adding-a-debate-format)).

```mermaid
flowchart LR
  Input[Buttons, keyboard,<br/>mouse and touch] --> Components[UI components]
  Components <--> Bus[EventBus]
  Bus <--> Core[Timer, PhaseManager<br/>and ConfigManager]
  Core --> Formats[FormatRegistry:<br/>self-describing format modules]
  Core <--> Services[Storage, keyboard<br/>and theme services]
  Components --> View[Projected timer,<br/>progress and phase list]
  Services <--> LocalStorage[(Browser localStorage)]
```

The timer is synchronized against wall-clock timestamps rather than counting interval ticks, so it never drifts when the browser is busy or deprioritizes the tab. The clock is sampled every 200 ms and a tick is emitted only when the displayed second changes, so a delayed callback on a slow machine still shows every second instead of skipping one.

## Technology Stack

| Area | Technology |
| --- | --- |
| Application | Vanilla JavaScript, ES modules, HTML5 |
| Styling | Modular CSS, custom properties, responsive breakpoints |
| Build tooling | Vite 7 |
| Testing | Vitest 5 with jsdom (unit + integration) |
| Linting | ESLint 10 (flat config) |
| Persistence | Browser `localStorage` |
| Hosting | Vercel |
| CI deployment | GitHub Actions workflow for GitHub Pages |

## Project Structure

```text
src/
|-- components/     # Timer, controls, phase list, configuration and theme UI
|-- core/           # Timer engine, phase manager, configuration and event bus
|-- formats/        # Self-describing format modules + FormatRegistry
|-- services/       # Browser storage, keyboard shortcuts and theme preference
|-- styles/         # Design tokens, layout, component and responsive styles
`-- main.js         # Application composition and event wiring
tests/              # Vitest unit tests and a jsdom integration test
```

## Adding a Debate Format

Formats are self-describing modules registered in `src/formats/FormatRegistry.js`. The configuration form, the format selector, the keyboard shortcut and the help panel are all generated from the registry, so adding a format never modifies existing components.

1. Create `src/formats/MyFormat.js` exporting an object with this contract:

```js
export default {
  id: 'myformat',            // config key and data-format id
  label: 'My Format',        // shown in the selector and the help panel
  shortcut: '3',             // optional keyboard shortcut (must be unique)
  defaults: { speechTime: 300, teamA: 'Team A' },
  fields: [                  // drives the generated configuration section
    { key: 'speechTime', label: 'Speech (sec)', type: 'number', step: 30, min: 0 },
    { key: 'teamA', label: 'Team A', type: 'text', placeholder: 'e.g. Team A' },
    // type: 'checkbox' is also supported; `showWhen: '<checkboxKey>'` makes a field conditional
  ],
  generatePhases(cfg) {      // receives the coerced config for this format
    return [{ name: `Opening (${cfg.teamA})`, duration: cfg.speechTime }];
  },
};
```

2. Register it at the bottom of `src/formats/FormatRegistry.js`:

```js
formatRegistry.register(MyFormat);
```

Deliberation and feedback phases are appended automatically after the format's own phases. Values are validated against `fields` when loading from `localStorage` and when applying the form, so `generatePhases` always receives numbers and booleans of the right type.

## Quality Checks

```bash
npm run lint   # ESLint (flat config)
npm test       # Vitest: unit tests + jsdom integration test
npm run check  # both
```

## Keyboard Controls

Keyboard controls can be disabled from the configuration panel and are ignored while typing in form fields.

<details>
<summary>Show all shortcuts</summary>

| Key | Action |
| --- | --- |
| `Space` | Start, pause, or resume |
| `R` | Reset the current phase |
| `D` | Reset the complete debate |
| `Left` / `Right` | Previous or next phase |
| `Up` / `Down` | Add or subtract 10 seconds |
| `+` / `-` | Add or subtract 30 seconds |
| `,` / `.` | Add or subtract 1 second |
| `C` | Open or close configuration |
| `F` | Open or close the phase list |
| `1` / `2` | Select Academic or British Parliamentary format |
| `H` | Show or hide keyboard help |
| `T` | Toggle light and dark mode |
| `Enter` | Apply the open configuration form |
| `Escape` | Close open panels |

</details>

## Run Locally

### Requirements

- Node.js `20.19+` or `22.12+`
- npm

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The application opens at [http://localhost:3000](http://localhost:3000).

Create and preview a production build:

```bash
npm run build
npm run preview
```

## Data and Privacy

The application has no backend and does not collect user data. Debate configuration and theme preferences remain in the current browser. Clearing site storage removes those preferences.

The deployed application loads its assets over the network; local persistence means that using the timer does not require registration or a remote database, not that the deployment is an installable offline PWA.

## Deployment

The production application is hosted on Vercel:

**[cronometro-ada.vercel.app](https://cronometro-ada.vercel.app/)**

The repository also contains a GitHub Actions workflow that builds the Vite application for GitHub Pages on pushes to `master`.

## Background

This is a personal project developed for the [Alicante Debate Association](https://www.instagram.com/ada_debate/). It translates real debate-room requirements into a focused tool for speakers, judges, and event organizers.
