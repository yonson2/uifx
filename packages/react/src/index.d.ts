// Types for @yonson2/uifx-react. Hand-written: keep them in step with index.js.

import type { ButtonHTMLAttributes, ElementType, HTMLAttributes, ImgHTMLAttributes, JSX, Ref } from "react";
import type { CordConfig, EffectName, PixelFieldOptions } from "@yonson2/uifx";

type Div = HTMLAttributes<HTMLDivElement>;

/** A button that switches light and dark with the wave transition. */
export function ThemeToggle(props: ButtonHTMLAttributes<HTMLButtonElement>): JSX.Element;

export function GlitchText(props: HTMLAttributes<HTMLElement> & { as?: ElementType }): JSX.Element;

export function CrtFilter(props: HTMLAttributes<HTMLElement> & { as?: ElementType }): JSX.Element;

export function ChromaticImage(
  props: ImgHTMLAttributes<HTMLImageElement> & { src: string; variant?: "shadow" | "jitter" | "layers" | "crt" },
): JSX.Element;

export function Oscilloscope(props: Div & { blocks?: boolean }): JSX.Element;

export interface ReelTitleHandle {
  replay(): void;
}

export function ReelTitle(
  props: Omit<Div, "onChange"> & {
    ref?: Ref<ReelTitleHandle>;
    rows?: string[];
    editable?: boolean;
    autoplay?: boolean;
    typos?: boolean;
    onChange?: (rows: string[]) => void;
  },
): JSX.Element;

/** The spot the pixel field draws its wordmark into. Put it inside <PixelField>. */
export function Wordmark(props: Div): JSX.Element;

export interface PixelFieldHandle {
  play(name?: EffectName | "random"): void;
}

export function PixelField(
  props: HTMLAttributes<HTMLElement> &
    Omit<PixelFieldOptions, "stamp"> & {
      ref?: Ref<PixelFieldHandle>;
      as?: ElementType;
    },
): JSX.Element;

/** The ceiling pull-cord. A pull toggles the theme with a crossfade, or calls onPull when given. */
export function PullCord(
  props: Div & {
    onPull?: () => void;
    label?: string;
    pressed?: boolean | null;
    entrance?: boolean;
    config?: Partial<CordConfig>;
  },
): JSX.Element;
