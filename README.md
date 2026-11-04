# uifx

Cool web effects, ported from the sites that made them, for plain HTML, React, Vue and Svelte.

| Effect | Source | What it does |
| --- | --- | --- |
| Theme wave | [kryogenix.org](https://www.kryogenix.org/code/browser/theme-transition.html), Stuart Langridge | The new theme comes in behind a cosine wave (view transition). |
| Glitch kit | [deloughry.co.uk](https://deloughry.co.uk/field-notes/building-glitch-effects-with-css/), Matt Deloughry | CSS-only scan lines, chromatic aberration, text glitch, oscilloscope, corruption blocks. |
| Reel title | [anoma.ly](https://anoma.ly/notes/opencode-reloaded), Kit Langton | An editable slot-machine title. A glass lens fixes typos, then you can type. |
| Pixel field | [omarchy.org](https://omarchy.org/) hero | Dithered pixel noise, a pointer glow, ripple stamps and entrance effects on a pixel wordmark. |
| Pull-cord | [mortspace/pullcord](https://github.com/mortspace/pullcord) (MIT), as on [physiohub.io](https://www.physiohub.io/blog/tripod-sign) | A Verlet rope that toggles the theme when you pull it. |

The demo site (GitHub Pages) shows every effect, with usage per framework.

## Packages

| Package | Contents |
| --- | --- |
| `@uifx/core` | The effects: CSS files and framework-free classes. No dependencies. |
| `@uifx/react` | React 19 components. |
| `@uifx/vue` | Vue 3 components. |
| `@uifx/svelte` | Svelte 5 components. |

The packages are not on npm yet. They ship plain JavaScript source, with no build step.

## Usage

Import the styles once:

```js
import "@uifx/core/index.css"; // or one file, for example "@uifx/core/glitch.css"
```

Plain HTML and JavaScript:

```js
import { PixelField, PullCord, ReelTitle, toggleTheme } from "@uifx/core";

new PixelField(document.querySelector("#hero"), { text: "HELLO" }); // the host holds a [data-pf-wordmark] element
new ReelTitle(document.querySelector("#title"), { rows: ["SPELLING", "RESTORED"] });
new PullCord(document.querySelector("#cord")); // a pull calls toggleTheme()
button.onclick = () => toggleTheme(); // sets data-theme on <html> with the wave
```

```html
<div class="uifx-crt"><img src="art.png" alt="" /></div>
<h2 class="uifx-glitch-text">SIGNAL LOST</h2>
```

React, Vue and Svelte use the same names:

```jsx
import { GlitchText, PixelField, PullCord, ReelTitle, ThemeToggle, Wordmark } from "@uifx/react"; // or @uifx/vue, @uifx/svelte

<PixelField text="HELLO"><Wordmark /></PixelField>
<ReelTitle rows={["SPELLING", "RESTORED"]} onChange={(rows) => {}} />
<GlitchText as="h2">SIGNAL LOST</GlitchText>
<PullCord />
<ThemeToggle>Toggle theme</ThemeToggle>
```

The theme helpers set `data-theme="light|dark"` on `<html>` and keep it in `localStorage`
(`uifx-theme`). Each effect reads its colours from CSS custom properties (`--uifx-*`), with
light and dark defaults. Every effect respects `prefers-reduced-motion`.

## Development

```sh
npm install
npm run dev       # demo site at http://localhost:5173/
npm test          # Vitest: reel title model, pixel field font and effects
npm run build     # site/dist/
npx vite preview  # serve the build at http://localhost:4173/
npm run shots     # Playwright screenshots of the build into shots/ (needs the preview)
```

`npm run shots` needs the Playwright browser once: `npx playwright install chromium`.

## GitHub Pages

`.github/workflows/pages.yml` tests, builds and deploys `site/dist` on each push to `main`.
In the repository settings, set Pages > Source to "GitHub Actions". The build uses relative
URLs, so it works under `/<repo>/`.

## Credits and licence

The code is rewritten. The ideas and the look belong to the people in the table above.
The pull-cord keeps its MIT notice in `packages/core/src/pull-cord/LICENSE`.
The demo font is [Commit Mono](https://commitmono.com/) (SIL Open Font License 1.1).
The demo image `site/shared/art.svg` is made for this repo.
The pixel field uses no Omarchy brand assets.

uifx is MIT licensed (see `LICENSE`).
