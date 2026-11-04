// Types for @uifx/vue. Hand-written: keep them in step with index.js.
// Listener props (onChange, onPress, onPull) are what @change, @press and @pull bind to.

import type { DefineComponent } from "vue";
import type { CordConfig, EffectName } from "@uifx/core";

/** A button that switches light and dark with the wave transition. */
export const ThemeToggle: DefineComponent<{}>;

export const GlitchText: DefineComponent<{ as?: string }>;

export const CrtFilter: DefineComponent<{ as?: string }>;

export const ChromaticImage: DefineComponent<{ src: string; alt?: string; variant?: "shadow" | "jitter" | "layers" | "crt" }>;

export const Oscilloscope: DefineComponent<{ blocks?: boolean }>;

/** The editable slot-machine title. Exposes replay(). */
export const ReelTitle: DefineComponent<
  { rows?: string[]; editable?: boolean; autoplay?: boolean; typos?: boolean; onChange?: (rows: string[]) => void },
  { replay(): void }
>;

/** The spot the pixel field draws its wordmark into. Put it inside <PixelField>. */
export const Wordmark: DefineComponent<{}>;

/** The animated pixel background with a wordmark. Exposes play(name). */
export const PixelField: DefineComponent<
  {
    as?: string;
    text?: string;
    bitmap?: string[] | null;
    scale?: number;
    gap?: number;
    intro?: EffectName | "random" | false;
    ghost?: boolean;
    onPress?: (() => void) | null;
  },
  { play(name?: EffectName | "random"): void }
>;

/** The ceiling pull-cord. A pull toggles the theme with a crossfade, or calls the @pull listener. */
export const PullCord: DefineComponent<{
  label?: string;
  pressed?: boolean | null;
  entrance?: boolean;
  config?: Partial<CordConfig> | null;
  onPull?: (() => void) | null;
}>;
