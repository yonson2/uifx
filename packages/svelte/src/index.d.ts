// Types for @yonson2/uifx-svelte. Hand-written: keep them in step with the .svelte files.

import type { Component, Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes, HTMLImgAttributes } from "svelte/elements";
import type { CordConfig, EffectName } from "@yonson2/uifx";

type Div = HTMLAttributes<HTMLDivElement>;

/** A button that switches light and dark with the wave transition. */
export const ThemeToggle: Component<HTMLButtonAttributes & { children?: Snippet }>;

export const GlitchText: Component<HTMLAttributes<HTMLElement> & { as?: string; children?: Snippet }>;

export const CrtFilter: Component<HTMLAttributes<HTMLElement> & { as?: string; children?: Snippet }>;

export const ChromaticImage: Component<HTMLImgAttributes & { src: string; variant?: "shadow" | "jitter" | "layers" | "crt" }>;

export const Oscilloscope: Component<Div & { blocks?: boolean }>;

/** The editable slot-machine title. bind:this gives replay(). */
export const ReelTitle: Component<
  Omit<Div, "onchange"> & { rows?: string[]; editable?: boolean; autoplay?: boolean; typos?: boolean; onchange?: (rows: string[]) => void },
  { replay(): void }
>;

/** The spot the pixel field draws its wordmark into. Put it inside <PixelField>. */
export const Wordmark: Component<Div>;

/** The animated pixel background with a wordmark. bind:this gives play(name). */
export const PixelField: Component<
  HTMLAttributes<HTMLElement> & {
    as?: string;
    text?: string;
    bitmap?: string[] | null;
    scale?: number;
    gap?: number;
    intro?: EffectName | "random" | false;
    ghost?: boolean;
    onpress?: (() => void) | null;
    children?: Snippet;
  },
  { play(name?: EffectName | "random"): void }
>;

/** The ceiling pull-cord. A pull toggles the theme with a crossfade, or calls onpull when given. */
export const PullCord: Component<
  Div & { onpull?: (() => void) | null; label?: string; pressed?: boolean | null; entrance?: boolean; config?: Partial<CordConfig> }
>;
