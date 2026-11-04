// Usage snippets for the gallery page, one set per effect.

const css = `import "@uifx/core/index.css";`;

export const SNIPPETS = {
  pixelField: {
    HTML: `<section class="uifx-pixel-field" id="hero">
  <div data-pf-wordmark></div>
  <div data-pf-quiet>Copy here keeps the noise calm.</div>
</section>

<script type="module">
  import { PixelField } from "@uifx/core";
  ${css}

  const field = new PixelField(document.getElementById("hero"), { text: "HELLO" });
  field.play("decrypt"); // rain, decrypt, scatter, sweep, middleout, unstable, burn, random
</script>`,
    React: `import { PixelField, Wordmark } from "@uifx/react";
${css}

const field = useRef(null); // field.current.play("burn")

<PixelField ref={field} text="HELLO" intro="rain">
  <Wordmark />
  <div data-pf-quiet>Copy here keeps the noise calm.</div>
</PixelField>`,
    Vue: `<script setup>
import { PixelField, Wordmark } from "@uifx/vue";
${css}
const field = ref(null); // field.value.play("burn")
</script>

<template>
  <PixelField ref="field" text="HELLO" intro="rain">
    <Wordmark />
    <div data-pf-quiet>Copy here keeps the noise calm.</div>
  </PixelField>
</template>`,
    Svelte: `<script>
  import { PixelField, Wordmark } from "@uifx/svelte";
  ${css}
  let field; // field.play("burn")
</script>

<PixelField bind:this={field} text="HELLO" intro="rain">
  <Wordmark />
  <div data-pf-quiet>Copy here keeps the noise calm.</div>
</PixelField>`,
  },

  reelTitle: {
    HTML: `<div id="title"></div>

<script type="module">
  import { ReelTitle } from "@uifx/core";
  ${css}

  const title = new ReelTitle(document.getElementById("title"), { rows: ["SPELLING", "RESTORED"] });
  document.getElementById("title").addEventListener("reelchange", (e) => console.log(e.detail.rows));
  title.replay();
</script>`,
    React: `import { ReelTitle } from "@uifx/react";

<ReelTitle ref={title} rows={["SPELLING", "RESTORED"]} onChange={(rows) => console.log(rows)} />`,
    Vue: `<ReelTitle ref="title" :rows="['SPELLING', 'RESTORED']" @change="(rows) => console.log(rows)" />`,
    Svelte: `<ReelTitle bind:this={title} rows={["SPELLING", "RESTORED"]} onchange={(rows) => console.log(rows)} />`,
  },

  glitch: {
    HTML: `<!-- CSS only: add a class. -->
<div class="uifx-crt"><img src="art.png" alt=""></div>
<img class="uifx-crt-image" src="art.png" alt="">
<img class="uifx-chroma" src="art.png" alt="">         <!-- or uifx-chroma-jitter -->
<span class="uifx-chroma-layers">
  <img src="art.png" alt="">
  <img class="uifx-chroma-red" src="art.png" alt="" aria-hidden="true">
  <img class="uifx-chroma-cyan" src="art.png" alt="" aria-hidden="true">
</span>
<h2 class="uifx-glitch-text">SIGNAL LOST</h2>
<div class="uifx-scope">
  <svg viewBox="0 0 200 40" preserveAspectRatio="none"><path class="uifx-scope-path" d="M0,20 Q10,5 20,20 Q30,35 40,20 ..."/></svg>
  <span class="uifx-glitch-block" style="left:12%;top:18%;width:18%;height:24%"></span>
</div>
<a class="uifx-glitch-card" href="#">...</a>`,
    React: `import { ChromaticImage, CrtFilter, GlitchText, Oscilloscope } from "@uifx/react";

<CrtFilter><img src={art} alt="" /></CrtFilter>
<ChromaticImage src={art} variant="layers" />   {/* shadow, jitter, layers, crt */}
<GlitchText as="h2">SIGNAL LOST</GlitchText>
<Oscilloscope />`,
    Vue: `<CrtFilter><img :src="art" alt="" /></CrtFilter>
<ChromaticImage :src="art" variant="layers" />
<GlitchText as="h2">SIGNAL LOST</GlitchText>
<Oscilloscope />`,
    Svelte: `<CrtFilter><img src={art} alt="" /></CrtFilter>
<ChromaticImage src={art} variant="layers" />
<GlitchText as="h2">SIGNAL LOST</GlitchText>
<Oscilloscope />`,
  },

  themeWave: {
    HTML: `<button id="toggle">Toggle theme</button>

<script type="module">
  import { restoreTheme, setTheme, toggleTheme, transitionTheme } from "@uifx/core";
  ${css}

  restoreTheme(); // early, before the first paint
  document.getElementById("toggle").onclick = () => toggleTheme();
  // setTheme("dark"), or wrap your own change: transitionTheme(() => body.classList.toggle("dim"))
</script>

<style>
  :root { --uifx-wave-duration: 1.5s; --uifx-wave-humps: 1.5; --uifx-wave-amplitude: 10%; }
  :root[data-theme="dark"] { /* your dark tokens */ }
</style>`,
    React: `import { ThemeToggle } from "@uifx/react";

<ThemeToggle>Toggle theme</ThemeToggle>`,
    Vue: `<ThemeToggle>Toggle theme</ThemeToggle>`,
    Svelte: `<ThemeToggle>Toggle theme</ThemeToggle>`,
  },

  pullCord: {
    HTML: `<div id="cord"></div>

<script type="module">
  import { PullCord } from "@uifx/core";
  ${css}

  // A pull toggles the theme with the wave. Pass onPull to do something else.
  new PullCord(document.getElementById("cord"), { label: "Toggle theme", hint: "pull me" });
</script>

<style>
  :root { --uifx-cord-top: 0px; --uifx-cord-right: 7rem; --uifx-cord-z: 5; }
</style>`,
    React: `import { PullCord } from "@uifx/react";

<PullCord label="Toggle theme" config={{ gravity: 1250, damping: 0.94 }} />`,
    Vue: `<PullCord label="Toggle theme" :config="{ gravity: 1250, damping: 0.94 }" />`,
    Svelte: `<PullCord label="Toggle theme" config={{ gravity: 1250, damping: 0.94 }} />`,
  },
};
