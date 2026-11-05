// Types for @yonson2/uifx. Hand-written: keep them in step with the JS (npm run types checks the use).

// Theme helpers (theme-transition.js)

export interface ThemeOptions {
  /** Attribute on <html> that holds the theme. Default "data-theme". */
  attribute?: string;
  /** localStorage key. Default "uifx-theme". */
  storageKey?: string;
}

export interface SetThemeOptions extends ThemeOptions {
  /** "wave" (default), "fade" (the browser's standard crossfade) or "none". */
  transition?: "wave" | "fade" | "none";
}

/** Runs `update` in a view transition: the wave by default, a crossfade with `wave: false`. */
export function transitionTheme(update: () => void, options?: { wave?: boolean }): Promise<void>;
/** The theme on <html>, else the system preference ("light" or "dark"). */
export function currentTheme(options?: Pick<ThemeOptions, "attribute">): string;
export function setTheme(theme: string, options?: SetThemeOptions): Promise<void>;
/** Switches between "light" and "dark". */
export function toggleTheme(options?: SetThemeOptions): Promise<void>;
/** Puts back the remembered theme and returns it. Call it before the first paint. */
export function restoreTheme(options?: ThemeOptions): string | null;
/**
 * The wave across a page load, for multi-page sites. Call it on every page, and put this inline in each <head>:
 * `<style>@view-transition { navigation: auto; types: uifx-theme-wave; }</style>`
 */
export function crossDocumentTheme(options?: ThemeOptions): void;
/** Remembers the theme and loads `url` (default: this page). */
export function navigateTheme(theme: string, options?: Pick<ThemeOptions, "storageKey"> & { url?: string | URL }): void;

// Reel title (reel-title/)

export interface ReelTitleOptions {
  /** The title, one string per row. Default ["SPELLING", "RESTORED"]. */
  rows?: string[];
  editable?: boolean;
  /** Play the typo intro on start. */
  autoplay?: boolean;
  typos?: boolean;
}

/** The editable slot-machine title. The host fires "reelchange" (CustomEvent<{ rows: string[] }>) on each edit. */
export class ReelTitle {
  constructor(host: HTMLElement, options?: ReelTitleOptions);
  /** Rewinds to the typos and plays the intro again. */
  replay(): Promise<void>;
  destroy(): void;
}

export type ReelChangeEvent = CustomEvent<{ rows: string[] }>;

export interface Letter {
  id: number;
  ch: string;
}

export interface ReelModel {
  rows: Letter[][];
  selection: { row: number; anchor: number; head: number } | null;
  nextId: number;
  maxCols: number;
}

export type TypoOp =
  | { type: "sub"; row: number; id: number; wheel: string[]; mistake: boolean }
  | { type: "del"; row: number; id: number }
  | { type: "rotate"; row: number; ids: number[]; by: number };

/** The characters a reel can show: A-Z, 0-9, # ? $ &. */
export const CHARSET: string;
export function createModel(rows: string[], maxCols?: number): ReelModel;
export function modelText(model: ReelModel): string[];
/** A typo version of `rows` and the steps that fix it. Same text, same result. */
export function makeTypos(rows: string[], seed?: number): { model: ReelModel; ops: TypoOp[] };
export function applyOps(model: ReelModel, ops: TypoOp[]): ReelModel;

// Pixel field (pixel-field/)

export type EffectName = "rain" | "decrypt" | "scatter" | "sweep" | "middleout" | "unstable" | "burn";

export interface Bitmap {
  /** Rows of "1" (ink) and "0". */
  rows: string[];
  width: number;
  height: number;
}

export interface PixelFieldOptions {
  /** Wordmark text, drawn in a 5x7 pixel font. Default "PIXELS". */
  text?: string;
  /** Own wordmark instead of text: rows of "1"/"#" (ink) and "0"/".". */
  bitmap?: string[] | null;
  /** Bitmap cells per font pixel. Default 2. */
  scale?: number;
  /** Font pixels between letters. Default 1. */
  gap?: number;
  /** Entrance effect on start, or false. Default "rain". */
  intro?: EffectName | "random" | false | null;
  /** The wandering second pointer. Default true. */
  ghost?: boolean;
  /** Stamp shape for press-and-hold, rows of "1"/"0". Default RIPPLE. */
  stamp?: string[];
  /** Replaces the random effect on a wordmark click. */
  onPress?: (() => void) | null;
}

/** Dithered pixel background around a [data-pf-wordmark] element inside the host. */
export class PixelField {
  constructor(host: HTMLElement, options?: PixelFieldOptions);
  play(name?: EffectName | "random"): void;
  destroy(): void;
}

export const RIPPLE: readonly string[];
export const EFFECT_NAMES: readonly EffectName[];
export function textToBitmap(text: string, options?: { scale?: number; gap?: number }): Bitmap;
export function parseBitmap(lines: string[]): Bitmap;

// Glitch kit (glitch/scope.js; the effects themselves are CSS classes)

export interface ScopeBlock {
  left: string;
  top: string;
  width: string;
  height: string;
  delay: string;
}

/** The oscilloscope path, for viewBox "0 0 200 40". */
export const SCOPE_WAVE: string;
export const SCOPE_BLOCKS: readonly ScopeBlock[];
/** Inline style for a .uifx-glitch-block. */
export function blockStyle(block: ScopeBlock): string;

// Pull-cord (pull-cord/)

export interface CordConfig {
  gravity: number;
  damping: number;
  iterations: number;
  stretchMax: number;
  stretchToggle: number;
  maxVelocity: number;
  sleepVelocity: number;
}

export interface PullCordOptions {
  /** Fires once per pull, mid-pull, and on click or Enter. Default: toggleTheme with a crossfade. */
  onPull?: (() => void) | null;
  /** Accessible name. Default "Toggle theme". */
  label?: string;
  /** Mirrored to aria-pressed; null leaves it out. */
  pressed?: boolean | null;
  /** The drop-in on start. Default true. */
  entrance?: boolean;
  config?: Partial<CordConfig>;
}

/** A ceiling pull-cord (Verlet rope). The host becomes the fixed wrapper. */
export class PullCord {
  constructor(host: HTMLElement, options?: PullCordOptions);
  setLabel(label: string): void;
  setPressed(pressed: boolean | null | undefined): void;
  setConfig(config: Partial<CordConfig>): void;
  destroy(): void;
}

export const CORD_CONFIG: Readonly<CordConfig>;
