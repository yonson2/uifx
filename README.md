# uifx

Cool web effects, ported from the sites that made them, for plain HTML, React, Vue and Svelte.

| Effect | Source | What it does |
| --- | --- | --- |
| Theme wave | [kryogenix.org](https://www.kryogenix.org/code/browser/theme-transition.html), Stuart Langridge | The new theme comes in behind a cosine wave (view transition). |
| Glitch kit | [deloughry.co.uk](https://deloughry.co.uk/field-notes/building-glitch-effects-with-css/), Matt Deloughry | CSS-only scan lines, chromatic aberration, text glitch, oscilloscope, corruption blocks. |
| Reel title | [anoma.ly](https://anoma.ly/notes/opencode-reloaded), Kit Langton | An editable slot-machine title. A glass lens fixes typos, then you can type. |
| Pixel field | [omarchy.org](https://omarchy.org/) hero | Dithered pixel noise, a pointer glow, ripple stamps and entrance effects on a pixel wordmark. |
| Pull-cord | [mortspace/pullcord](https://github.com/mortspace/pullcord) (MIT), as on [physiohub.io](https://www.physiohub.io/blog/tripod-sign) | A Verlet rope that toggles the theme when you pull it. |

The [demo site](https://yonson2.github.io/uifx/) shows every effect, with usage per framework.

## Packages

| Package | Contents |
| --- | --- |
| `@yonson2/uifx` | The effects: CSS files and framework-free classes. No dependencies. |
| `@yonson2/uifx-react` | React 19 components. |
| `@yonson2/uifx-vue` | Vue 3 components. |
| `@yonson2/uifx-svelte` | Svelte 5 components. |

```sh
npm install @yonson2/uifx @yonson2/uifx-react   # or -vue, -svelte
```

The packages ship plain JavaScript source, with no build step, and hand-written TypeScript
declarations (`index.d.ts`).

## Usage

Import the styles once:

```js
import "@yonson2/uifx/index.css"; // or one file, for example "@yonson2/uifx/glitch.css"
```

Plain HTML and JavaScript:

```js
import { PixelField, PullCord, ReelTitle, toggleTheme } from "@yonson2/uifx";

new PixelField(document.querySelector("#hero"), { text: "HELLO" }); // the host holds a [data-pf-wordmark] element
new ReelTitle(document.querySelector("#title"), { rows: ["SPELLING", "RESTORED"] });
new PullCord(document.querySelector("#cord")); // a pull toggles the theme with a crossfade
button.onclick = () => toggleTheme(); // sets data-theme on <html> with the wave
```

```html
<div class="uifx-crt"><img src="art.png" alt="" /></div>
<h2 class="uifx-glitch-text">SIGNAL LOST</h2>
```

React, Vue and Svelte use the same names:

```jsx
import { GlitchText, PixelField, PullCord, ReelTitle, ThemeToggle, Wordmark } from "@yonson2/uifx-react"; // or @yonson2/uifx-vue, @yonson2/uifx-svelte

<PixelField text="HELLO"><Wordmark /></PixelField>
<ReelTitle rows={["SPELLING", "RESTORED"]} onChange={(rows) => {}} />
<GlitchText as="h2">SIGNAL LOST</GlitchText>
<PullCord />
<ThemeToggle>Toggle theme</ThemeToggle>
```

The theme helpers set `data-theme="light|dark"` on `<html>` and keep it in `localStorage`
(`uifx-theme`). They use the wave; pass `{ transition: "fade" }` for the browser's standard
crossfade, or `"none"`. Each effect reads its colours from CSS custom properties (`--uifx-*`), with
light and dark defaults. Every effect respects `prefers-reduced-motion`.

Multi-page sites can run the wave across a page load, as in the original
([demo](https://yonson2.github.io/uifx/mpa/)). Call `crossDocumentTheme()` on every page and
put this rule inline in each `<head>` (Chromium can miss it in an external stylesheet):

```html
<style>
  @view-transition { navigation: auto; types: uifx-theme-wave; }
</style>
```

`navigateTheme("dark", { url })` stores the theme and loads the page (default: this page).
When the next page gets another theme, the wave plays; other navigations get no
transition. Browsers without cross-document view transitions (Firefox) switch at once.

## Development

```sh
npm install
npm run dev       # demo site at http://localhost:5173/
npm test          # Vitest: reel title model, pixel field font and effects
npm run types     # tsc: the .d.ts files against typed use in tests/types/
npm run build     # site/dist/
npx vite preview  # serve the build at http://localhost:4173/
npm run shots     # Playwright screenshots of the build into shots/ (needs the preview)
npm run bump 0.2.0  # one version on all four packages, and the lockfile
```

`npm run shots` needs the Playwright browser once: `npx playwright install chromium`.

## GitHub Pages

`.github/workflows/pages.yml` tests, builds and deploys `site/dist` on each push to `main`.
In the repository settings, set Pages > Source to "GitHub Actions". The build uses relative
URLs, so it works under `/<repo>/`.

## npm

The four packages share one version. `.github/workflows/publish.yml` publishes each package
whose version is not on npm yet, on a push to `main`. It uses npm trusted publishing (OIDC),
so there is no token, and npm adds provenance.

## Credits and licence

The code is rewritten. The ideas and the look belong to the people in the table above.
The pull-cord keeps its MIT notice in `packages/core/src/pull-cord/LICENSE`.
The demo font is [Commit Mono](https://commitmono.com/) (SIL Open Font License 1.1).
The demo image `site/shared/art.svg` is made for this repo.
The pixel field uses no Omarchy brand assets.

uifx is MIT licensed (see `LICENSE`).
