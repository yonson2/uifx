# uifx - Working agreements

> **Live document** for anyone (human or agent) working on this repo. Update it when a
> practice changes or a new hard rule appears. There is no `CLAUDE.md`: Claude Code reads
> this file (D1).

## What uifx is

uifx is a set of web effects ported from the sites that made
them. Each effect has a framework-free core (`@yonson2/uifx`) and thin wrappers for
React, Vue and Svelte. A demo site on GitHub Pages shows every effect, for every framework.

The repo is public.

## Start here

1. `issues/README.md` is the source of truth for WHAT to do: the issue index, one file per
   issue in `issues/open|active|done/`. **The tracker is local and gitignored (D2):** it
   exists only in the owner's working tree, never in git. **At start:** read the index,
   then anything in `issues/active/`. "Continue" means: take the top of the open pile.
   **Gate issues need the owner's answers before the issues that depend on them start,
   even in auto mode.** An issue is done only when its **Verification** passes. History
   sits beside the index, read on demand: `issues/done-log.md` (closed issues, newest
   first) and `issues/decisions.md` (the D rows and the gate answers).
2. `ARCHITECTURE.md` describes what IS: structure, components, deploy.
3. `README.md` is the public page: usage, credits, commands.

## Tracker and live-docs discipline

- **Issues:** new issues use `issues/TEMPLATE.md` and the "Next ID" in `issues/README.md`.
  Change status by moving the file `open/ -> active/ -> done/` and updating the index at
  the same time. A close sets **Closed:**, records the result and its evidence in Notes,
  and adds a line at the top of `issues/done-log.md`. Every issue keeps a runnable
  **Verification** line.
- **Discoveries:** file untracked work, follow-ups and dead ends as open issues (or in the
  Notes of the issue they belong to). Never leave a discovery only in chat.
- **Decisions:** an owner decision goes into `issues/decisions.md` with its date.
- **After a structural change** (a package, an effect, an entry page, a dependency, the
  deploy): update `ARCHITECTURE.md`, and `README.md` when usage changes.
- `issues/` is not in git: committed code never depends on it. The IDs in this file
  (D1, D11, ...) point into the owner's local tracker.

## Hard rules

- **Credit and licence:** every ported effect names its source in its file header, in
  `README.md` and on the demo site. Upstream licence notices stay (the pull-cord's MIT
  `LICENSE`). Code from a source with an unknown licence is rewritten, never copied, and ships
  credited (D10).
- **No brand assets:** no logos, wordmark bitmaps or brand names from the source sites in
  the demo content (D11).
- **Core first:** behaviour lives in `@yonson2/uifx`. A wrapper only creates, updates and
  destroys the engine and maps props and events. A new effect ships in all four forms
  (HTML, React, Vue, Svelte) and on the demo site.
- **Reduced motion:** every effect checks `prefers-reduced-motion` and stays usable
  without animation.
- **Theming:** colours come from `--uifx-*` custom properties with light and dark
  defaults (`prefers-color-scheme` and `:root[data-theme]`).
- **No secrets in git.**

## Code standards

- Plain modern JavaScript (ES modules), no build step for the packages. Types are
  hand-written `src/index.d.ts` files, one per package (D12): change them with the JS, and
  add typed use to `tests/types/`.
  React and Vue wrappers use `createElement` and `h()`, so they run without JSX or SFC
  compilers.
- Class names and custom properties carry the `uifx-` prefix.
- Keep pure logic (the reel model, typos, font, entrance effects) in plain modules with
  Vitest tests in `tests/`.
- Minimum code that solves the issue; match the style around it; no speculative
  abstraction. Comments say why, not what.
- Pin exact dependency versions in `package.json`.

## Versions

- The four packages share one version. Set it with `npm run bump <x.y.z>`: it also sets the
  wrappers' core dependency and updates the lockfile.
- Bump without asking (D16) when a change alters what a package ships: code, types, CSS,
  exports or dependencies. Changes to the site, tests, tools or docs need no bump.
- Semver for 0.x: a fix is a patch (0.1.0 to 0.1.1), a new feature or a breaking change is
  a minor (0.1.0 to 0.2.0).
- One bump per release: when the current version is not on npm yet
  (`npm view @yonson2/uifx@<version>`), an earlier unpushed commit has bumped it already.
  Raise it again only for a larger step.
- Put the bump in the commit of the change. The owner's push to `main` publishes it
  (`publish.yml`).

## Git

- Commit only when the owner asks. Messages are short.
- Stage explicit paths, never `git add -A` or `git add .`.
- No `Co-Authored-By` trailers or any other AI attribution in commits (D9).
- Never push, and never create the GitHub repo: the owner does that (D4).

## Commands

- Install: `npm install` (links `packages/*` into `node_modules/@yonson2/`)
- Dev server: `npm run dev` (<http://localhost:5173/>, pages `/`, `/react/`, `/vue/`, `/svelte/`)
- Tests: `npm test`
- Types: `npm run types` (tsc over `tests/types/`; a `@ts-expect-error` line that stops
  failing fails the check)
- Build: `npm run build` (writes `site/dist/`)
- Preview the build: `npx vite preview` (<http://localhost:4173/>)
- Screenshots: `npm run shots [base URL]` with the preview running. It writes
  `shots/<page>-<theme>.png` (and `-full`) and fails on a console error. Install the
  browser once: `npx playwright install chromium`.
- Containers, if ever needed: Podman, never Docker Desktop.
- CI: `.github/workflows/pages.yml` tests, builds and deploys to GitHub Pages on push to
  `main`; pull requests only test and build. `.github/workflows/publish.yml` publishes new
  package versions to npm on push to `main`.

## Verification culture

Turn tasks into verifiable goals: a test for pure logic, a screenshot or a scripted
browser check for visuals and interaction. Check light and dark, and reduced motion, before
calling an effect done.
