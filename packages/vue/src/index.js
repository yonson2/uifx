// Vue 3 components for @yonson2/uifx. Render functions, so no build step is needed.
// Import the styles once: import "@yonson2/uifx/index.css".

import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { CORD_CONFIG, PixelField as PixelFieldEngine, PullCord as PullCordEngine, ReelTitle as ReelTitleEngine, SCOPE_BLOCKS, SCOPE_WAVE, blockStyle, toggleTheme } from "@yonson2/uifx";

/** A button that switches light and dark with the wave transition. */
export const ThemeToggle = defineComponent({
  name: "ThemeToggle",
  setup(_, { slots }) {
    return () => h("button", { type: "button", onClick: () => toggleTheme() }, slots.default?.() ?? "Toggle theme");
  },
});

export const GlitchText = defineComponent({
  name: "GlitchText",
  props: { as: { type: String, default: "span" } },
  setup(props, { slots }) {
    return () => h(props.as, { class: "uifx-glitch-text" }, slots.default?.());
  },
});

export const CrtFilter = defineComponent({
  name: "CrtFilter",
  props: { as: { type: String, default: "div" } },
  setup(props, { slots }) {
    return () => h(props.as, { class: "uifx-crt" }, slots.default?.());
  },
});

/** variant: "shadow" (default), "jitter", "layers" or "crt". */
export const ChromaticImage = defineComponent({
  name: "ChromaticImage",
  props: { src: { type: String, required: true }, alt: { type: String, default: "" }, variant: { type: String, default: "shadow" } },
  setup(props) {
    return () => {
      if (props.variant === "layers")
        return h("span", { class: "uifx-chroma-layers" }, [
          h("img", { src: props.src, alt: props.alt }),
          h("img", { src: props.src, alt: "", "aria-hidden": "true", class: "uifx-chroma-red" }),
          h("img", { src: props.src, alt: "", "aria-hidden": "true", class: "uifx-chroma-cyan" }),
        ]);
      const name = { shadow: "uifx-chroma", jitter: "uifx-chroma-jitter", crt: "uifx-crt-image" }[props.variant];
      return h("img", { src: props.src, alt: props.alt, class: name });
    };
  },
});

export const Oscilloscope = defineComponent({
  name: "Oscilloscope",
  props: { blocks: { type: Boolean, default: true } },
  setup(props) {
    return () =>
      h("div", { class: "uifx-scope" }, [
        h("svg", { viewBox: "0 0 200 40", preserveAspectRatio: "none", "aria-hidden": "true" }, [h("path", { class: "uifx-scope-path", d: SCOPE_WAVE })]),
        ...(props.blocks ? SCOPE_BLOCKS.map((b) => h("span", { class: "uifx-glitch-block", style: blockStyle(b) })) : []),
      ]);
  },
});

/** The editable slot-machine title. Emits "change" with the rows; exposes replay(). */
export const ReelTitle = defineComponent({
  name: "ReelTitle",
  props: {
    rows: { type: Array, default: () => ["SPELLING", "RESTORED"] },
    editable: { type: Boolean, default: true },
    autoplay: { type: Boolean, default: true },
    typos: { type: Boolean, default: true },
  },
  emits: ["change"],
  setup(props, { emit, expose }) {
    const host = ref(null);
    let engine = null;
    const listen = (event) => emit("change", event.detail.rows);
    const mount = () => {
      engine?.destroy();
      engine = new ReelTitleEngine(host.value, { rows: [...props.rows], editable: props.editable, autoplay: props.autoplay, typos: props.typos });
    };
    onMounted(() => {
      host.value.addEventListener("reelchange", listen);
      mount();
    });
    watch(() => [props.rows.join("\n"), props.editable, props.autoplay, props.typos], mount);
    onBeforeUnmount(() => {
      host.value?.removeEventListener("reelchange", listen);
      engine?.destroy();
    });
    expose({ replay: () => engine?.replay() });
    return () => h("div", { ref: host, class: "uifx-reel" });
  },
});

/** The spot the pixel field draws its wordmark into. Put it inside <PixelField>. */
export const Wordmark = defineComponent({
  name: "Wordmark",
  setup() {
    return () => h("div", { "data-pf-wordmark": "", class: "uifx-pixel-field-wordmark" });
  },
});

/** The animated pixel background with a wordmark. A @press listener replaces the click effect; exposes play(name). */
export const PixelField = defineComponent({
  name: "PixelField",
  props: {
    as: { type: String, default: "section" },
    text: { type: String, default: "PIXELS" },
    bitmap: { type: Array, default: null },
    scale: { type: Number, default: 2 },
    gap: { type: Number, default: 1 },
    intro: { type: [String, Boolean], default: "rain" },
    ghost: { type: Boolean, default: true },
    // Declared as a prop so the component knows whether a @press listener exists.
    onPress: { type: Function, default: null },
  },
  setup(props, { slots, expose }) {
    const host = ref(null);
    let engine = null;
    const mount = () => {
      engine?.destroy();
      engine = new PixelFieldEngine(host.value, {
        text: props.text,
        bitmap: props.bitmap,
        scale: props.scale,
        gap: props.gap,
        intro: props.intro,
        ghost: props.ghost,
        onPress: props.onPress ? () => props.onPress() : null,
      });
    };
    onMounted(mount);
    watch(() => [props.text, props.bitmap?.join("\n"), props.scale, props.gap, props.intro, props.ghost], mount);
    onBeforeUnmount(() => engine?.destroy());
    expose({ play: (name) => engine?.play(name) });
    return () => h(props.as, { ref: host, class: "uifx-pixel-field" }, slots.default?.());
  },
});

/** The ceiling pull-cord. A pull toggles the theme with a crossfade, or calls the @pull listener when given. */
export const PullCord = defineComponent({
  name: "PullCord",
  props: {
    label: { type: String, default: "Toggle theme" },
    pressed: { type: Boolean, default: null },
    entrance: { type: Boolean, default: true },
    config: { type: Object, default: null },
    // Declared as a prop so the component knows whether a @pull listener exists.
    onPull: { type: Function, default: null },
  },
  setup(props) {
    const host = ref(null);
    let engine = null;
    const mount = () => {
      engine?.destroy();
      const { label, pressed, config, entrance } = props;
      engine = new PullCordEngine(host.value, { label, pressed, config, entrance, ...(props.onPull && { onPull: () => props.onPull() }) });
    };
    onMounted(mount);
    watch(() => [Boolean(props.onPull), props.entrance], mount);
    watch(() => props.label, (label) => engine?.setLabel(label));
    watch(() => props.pressed, (pressed) => engine?.setPressed(pressed));
    watch(() => props.config, (config) => engine?.setConfig({ ...CORD_CONFIG, ...config }), { deep: true });
    onBeforeUnmount(() => engine?.destroy());
    return () => h("div", { ref: host, class: "uifx-pull-cord" });
  },
});
