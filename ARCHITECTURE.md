# Architecture

> This file describes what IS. It follows the [architecture.md](https://architecture.md/)
> template. Update it when the structure changes: a package, an effect, an entry point, a
> dependency or the deploy.

## 1. Project Structure

```
.
├── packages/
│   ├── core/                    @uifx/core: the effects, framework-free
│   │   └── src/
│   │       ├── index.js         public JS API (re-exports)
│   │       ├── index.css        all effect styles (@import of the files below)
│   │       ├── theme-transition/  theme-transition.{css,js}: wave view transition, theme helpers
│   │       ├── glitch/          glitch.css (CSS only) + scope.js (oscilloscope markup data)
│   │       ├── reel-title/      model.js (pure editing model) + reel-title.{js,css} (SVG engine)
│   │       ├── pixel-field/     pixel-field.{js,css} (canvas engine), effects.js, font.js
│   │       └── pull-cord/       pull-cord.{js,css} (Verlet rope), LICENSE (MIT, upstream)
│   ├── react/src/index.js       @uifx/react: createElement wrappers (no JSX, no build)
│   ├── vue/src/index.js         @uifx/vue: defineComponent + h() wrappers (no SFC, no build)
│   └── svelte/src/*.svelte      @uifx/svelte: Svelte 5 components (runes)
├── site/                        demo site, Vite root (multi-page)
│   ├── index.html, main.js      gallery: plain HTML + @uifx/core, docs and usage tabs
│   ├── react/                   the same effects through @uifx/react
│   ├── vue/                     ... through @uifx/vue
│   ├── svelte/                  ... through @uifx/svelte
│   └── shared/                  site.css, chrome.js (theme buttons, tabs), snippets.js, art.svg
├── tests/                       Vitest unit tests of the pure modules
├── tools/shots.mjs              Playwright screenshots of the built site
├── .github/workflows/pages.yml  CI: test, build, deploy to GitHub Pages
├── vite.config.js               Vite (site build) + Vitest config
├── AGENTS.md                    working agreements for humans and agents
└── issues/                      local issue tracker (gitignored, D2)
```

## 2. High-Level System Diagram

There is no server. Everything runs in the browser.

```
                ┌──────────────── @uifx/core ────────────────┐
 HTML page ───▶ │ CSS (classes, custom properties, keyframes)│
                │ JS engines: ReelTitle, PixelField, PullCord│
                │ theme helpers ── document.startViewTransition
                └───────▲───────────────▲───────────────▲────┘
                        │               │               │
                 @uifx/react      @uifx/vue      @uifx/svelte
                 (thin wrappers: create the engine on mount,
                  destroy it on unmount, map props/events)

 site/ (Vite multi-page) ──build──▶ site/dist ──Actions──▶ GitHub Pages
```

## 3. Core Components

### 3.1 Frontend

**@uifx/core** holds all behaviour. Each JS effect is a class that takes a host element and
options, builds its DOM inside the host, and has `destroy()`.

- **Theme wave** (`theme-transition/`). `transitionTheme(update)` adds the class
  `uifx-theme-wave` on `<html>` and runs `update` in `document.startViewTransition`. The CSS
  clips `::view-transition-new(root)` with a 21-point polygon on a cosine wave, driven by
  the registered property `--uifx-wave-time`. `setTheme`, `toggleTheme`, `currentTheme`,
  `restoreTheme` keep `data-theme` on `<html>` and in `localStorage`. Without the API, or
  with reduced motion, `update` runs at once.
- **Glitch kit** (`glitch/`). CSS only. `scope.js` exports the oscilloscope path and the
  corruption block positions, so every wrapper renders the same markup.
- **Reel title** (`reel-title/`). `model.js` is pure: rows of letters with stable ids, a
  selection, and edit functions (`typeText`, `erase`, `cycle`, `rotate`). `makeTypos` makes
  a deterministic typo version of the title and the ops that fix it. `reel-title.js` draws
  an SVG: one clipped reel per cell, motion blur by speed, a glass lens (magnified `<use>`
  copies with colour fringes), per-row glitch filters. One rAF loop drives keyed,
  cancellable animations. Edits go through `commit()` (undo/redo stack), then `sync()`
  diffs by id into roll, remove and insert animations. A hidden textarea takes the keys;
  an sr-only span holds the text. It fires `reelchange` with `detail.rows`.
- **Pixel field** (`pixel-field/`). A canvas behind the host content, on a grid aligned to
  the `[data-pf-wordmark]` element. Per frame (about 40 fps): tileable value noise, a
  vignette mask, a twinkle term, a Bayer 8×8 dither, a pointer and ghost glow (calmer near
  `[data-pf-quiet]`), ripple stamps, and the wordmark in five colour bands. `effects.js`
  has the entrance effects (each `{duration, at(cell, ms)}`); `font.js` turns text into a
  5×7 bitmap. The loop pauses off screen (IntersectionObserver) and re-reads the colour
  tokens when the theme changes (MutationObserver).
- **Pull-cord** (`pull-cord/`). A fixed element with an SVG rope of 16 Verlet segments.
  Dragging pins the last node to the pointer (clamped to `stretchMax`); crossing
  `stretchToggle` fires `onPull` once per pull. Click and Enter give a scripted yank. The
  rAF loop sleeps when the rope is still. The default `onPull` is `toggleTheme()`.

**Wrappers** keep no logic. React and Vue are plain JS (`createElement`, `h()`), so the
packages need no build. Each component creates the engine on mount, recreates it when a
structural prop changes (rows, text, bitmap), calls setters for live props (label,
pressed, config), and destroys it on unmount. `ReelTitle` exposes `replay()`;
`PixelField` exposes `play(name)`.

**Demo site** (`site/`). Four Vite entry pages. The HTML page has the docs and the usage
tabs (`shared/snippets.js`); the framework pages render every effect through their
wrappers. An inline script in each `<head>` restores the theme before the first paint.

### 3.2 Backend Services

None.

## 4. Data Stores

- `localStorage["uifx-theme"]`: the chosen theme. Reads and writes are wrapped in
  try/catch, so a blocked storage only loses the memory.
- No other state leaves the page.

## 5. External Integrations / APIs

- Browser APIs: View Transitions (same-document), `@property`, CSS `d: path()`,
  Canvas 2D, ResizeObserver, IntersectionObserver, MutationObserver, Pointer Events.
- No network calls at run time. The font is bundled from `@fontsource/commit-mono`.

## 6. Deployment & Infrastructure

- `.github/workflows/pages.yml`: on push to `main`, `npm ci`, `npm test`, `npm run build`,
  then upload `site/dist` and deploy with `actions/deploy-pages`. Pull requests run the
  test and build only.
- `base: "./"` in `vite.config.js` makes every URL relative, so the site works under
  `https://<user>.github.io/<repo>/`.
- The repository owner creates the GitHub repo, pushes, and sets Pages > Source to
  "GitHub Actions".

## 7. Security Considerations

- No secrets, no server, no user data beyond the theme choice.
- Engines build DOM with `createElement`/`textContent`, or `innerHTML` from constant
  templates only; user text (titles, hints) never goes into `innerHTML`.
- Third-party code: the pull-cord is MIT (notice kept). The other effects are rewritten
  from public pages and ship as credited rewrites, with no code copied (D10).

## 8. Development & Testing Environment

- Node 24, npm workspaces (`packages/*`). `npm install` links the packages into
  `node_modules/@uifx/`.
- `npm run dev`: Vite dev server for the site. `npm run build`: `site/dist`.
- `npm test`: Vitest over `tests/` (the pure modules: reel model and typos, font, entrance
  effects).
- Visual check: `npm run build`, `npx vite preview`, `npm run shots` (light and dark shots
  of all four pages; it fails on a console error).

## 9. Future Considerations / Roadmap

See `issues/README.md` (local). Open topics: npm publishing, TypeScript types, a
cross-document variant of the wave.

## 10. Project Identification

- Name: uifx
- Licence: MIT (`LICENSE`)
- Repository: https://github.com/yonson2/uifx
- Demo: https://yonson2.github.io/uifx/
- Contact: the repository owner
- Last updated: 2026-11-04

## 11. Glossary / Acronyms

- **Engine**: the framework-free class in `@uifx/core` behind a component.
- **Host**: the element an engine builds into.
- **View transition**: the browser API that snapshots the page before and after a DOM
  change and animates between them (`::view-transition-old/new(root)`).
- **Verlet**: an integration method that keeps the previous position instead of a velocity.
- **Bayer dither**: an ordered threshold matrix that turns a smooth value into on/off cells.
- **Wordmark**: the pixel text the pixel field draws.
- **Ghost**: the automatic, wandering second pointer of the pixel field.
- **Typo ops**: the steps (`sub`, `del`, `rotate`) that fix the reel title's intro typos.
