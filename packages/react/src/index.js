// React components for @yonson2/uifx. Plain createElement, so no build step is needed.
// Import the styles once: import "@yonson2/uifx/index.css".

import { createElement as h, useEffect, useImperativeHandle, useRef } from "react";
import { CORD_CONFIG, PixelField as PixelFieldEngine, PullCord as PullCordEngine, ReelTitle as ReelTitleEngine, SCOPE_BLOCKS, SCOPE_WAVE, toggleTheme } from "@yonson2/uifx";

const cx = (...names) => names.filter(Boolean).join(" ");

/** A button that switches light and dark with the wave transition. */
export function ThemeToggle({ onClick, children, ...rest }) {
  const click = (event) => {
    onClick?.(event);
    toggleTheme();
  };
  return h("button", { type: "button", onClick: click, ...rest }, children ?? "Toggle theme");
}

export function GlitchText({ as = "span", className, ...rest }) {
  return h(as, { className: cx("uifx-glitch-text", className), ...rest });
}

export function CrtFilter({ as = "div", className, ...rest }) {
  return h(as, { className: cx("uifx-crt", className), ...rest });
}

/** variant: "shadow" (default), "jitter", "layers" or "crt". */
export function ChromaticImage({ variant = "shadow", src, alt = "", className, ...rest }) {
  if (variant === "layers")
    return h(
      "span",
      { className: cx("uifx-chroma-layers", className) },
      h("img", { src, alt, ...rest }),
      h("img", { src, alt: "", "aria-hidden": "true", className: "uifx-chroma-red" }),
      h("img", { src, alt: "", "aria-hidden": "true", className: "uifx-chroma-cyan" }),
    );
  const name = { shadow: "uifx-chroma", jitter: "uifx-chroma-jitter", crt: "uifx-crt-image" }[variant];
  return h("img", { src, alt, className: cx(name, className), ...rest });
}

export function Oscilloscope({ blocks = true, className, ...rest }) {
  return h(
    "div",
    { className: cx("uifx-scope", className), ...rest },
    h("svg", { viewBox: "0 0 200 40", preserveAspectRatio: "none", "aria-hidden": "true" }, h("path", { className: "uifx-scope-path", d: SCOPE_WAVE })),
    blocks &&
      SCOPE_BLOCKS.map((b, i) =>
        h("span", { key: i, className: "uifx-glitch-block", style: { left: b.left, top: b.top, width: b.width, height: b.height, animationDelay: b.delay } }),
      ),
  );
}

/** The editable slot-machine title. `ref` gets { replay() }. */
export function ReelTitle({ ref, rows = ["SPELLING", "RESTORED"], editable = true, autoplay = true, typos = true, onChange, className, ...rest }) {
  const host = useRef(null);
  const engine = useRef(null);
  const change = useRef(onChange);
  change.current = onChange;
  const key = rows.join("\n");
  useEffect(() => {
    const node = host.current;
    const instance = new ReelTitleEngine(node, { rows: key.split("\n"), editable, autoplay, typos });
    const listen = (event) => change.current?.(event.detail.rows);
    node.addEventListener("reelchange", listen);
    engine.current = instance;
    return () => {
      node.removeEventListener("reelchange", listen);
      instance.destroy();
    };
  }, [key, editable, autoplay, typos]);
  useImperativeHandle(ref, () => ({ replay: () => engine.current?.replay() }), []);
  return h("div", { ref: host, className: cx("uifx-reel", className), ...rest });
}

/** The spot the pixel field draws its wordmark into. Put it inside <PixelField>. */
export function Wordmark({ className, ...rest }) {
  return h("div", { "data-pf-wordmark": "", className: cx("uifx-pixel-field-wordmark", className), ...rest });
}

/** The animated pixel background with a wordmark. `ref` gets { play(name) }. */
export function PixelField({ ref, as = "section", text = "PIXELS", bitmap, scale = 2, gap = 1, intro = "rain", ghost = true, onPress, className, children, ...rest }) {
  const host = useRef(null);
  const engine = useRef(null);
  const press = useRef(onPress);
  press.current = onPress;
  const hasPress = Boolean(onPress);
  const bitmapKey = bitmap ? bitmap.join("\n") : "";
  useEffect(() => {
    const instance = new PixelFieldEngine(host.current, {
      text,
      bitmap: bitmapKey ? bitmapKey.split("\n") : null,
      scale,
      gap,
      intro,
      ghost,
      onPress: hasPress ? () => press.current?.() : null,
    });
    engine.current = instance;
    return () => instance.destroy();
  }, [text, bitmapKey, scale, gap, intro, ghost, hasPress]);
  useImperativeHandle(ref, () => ({ play: (name) => engine.current?.play(name) }), []);
  return h(as, { ref: host, className: cx("uifx-pixel-field", className), ...rest }, children);
}

/** The ceiling pull-cord. A pull toggles the theme with a crossfade, or calls onPull when given. */
export function PullCord({ onPull, label = "Toggle theme", pressed = null, entrance = true, config, className, ...rest }) {
  const host = useRef(null);
  const engine = useRef(null);
  const pull = useRef(onPull);
  pull.current = onPull;
  const hasPull = Boolean(onPull);
  useEffect(() => {
    const instance = new PullCordEngine(host.current, { label, pressed, config, entrance, ...(hasPull && { onPull: () => pull.current?.() }) });
    engine.current = instance;
    return () => instance.destroy();
  }, [hasPull, entrance]);
  useEffect(() => engine.current?.setLabel(label), [label]);
  useEffect(() => engine.current?.setPressed(pressed), [pressed]);
  useEffect(() => engine.current?.setConfig({ ...CORD_CONFIG, ...config }));
  return h("div", { ref: host, className: cx("uifx-pull-cord", className), ...rest });
}
