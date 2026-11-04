<script>
  import { EFFECT_NAMES } from "@uifx/core";
  import { ChromaticImage, CrtFilter, GlitchText, Oscilloscope, PixelField, PullCord, ReelTitle, ThemeToggle, Wordmark } from "@uifx/svelte";
  import art from "../shared/art.svg";

  const rows = ["SPELLING", "RESTORED"];
  let field;
  let title;
  let text = $state(rows.join(" / "));
</script>

<PullCord />
<PixelField bind:this={field} class="hero" text="SVELTE" aria-label="Pixel field demo">
  <Wordmark />
  <div class="hero-copy" data-pf-quiet>
    <h1 class="uifx-rise">Every effect, rendered with @uifx/svelte.</h1>
    <p class="uifx-rise" style="--uifx-stagger: 1">Move the pointer. Press and hold, then let go. Click the word.</p>
  </div>
</PixelField>

<section class="section">
  <div class="eyebrow">Pixel field</div>
  <h2>&lt;PixelField&gt;</h2>
  <div class="controls">
    {#each ["random", ...EFFECT_NAMES] as name (name)}
      <button class="button" type="button" onclick={() => field.play(name)}>{name}</button>
    {/each}
  </div>
</section>

<section class="section">
  <div class="eyebrow">Reel title</div>
  <h2>&lt;ReelTitle&gt;</h2>
  <div class="stage">
    <div class="reel-stage">
      <ReelTitle bind:this={title} {rows} onchange={(next) => (text = next.join(" / "))} />
    </div>
  </div>
  <div class="controls">
    <button class="button" type="button" onclick={() => title.replay()}>Replay</button>
    <code>onchange: {text}</code>
  </div>
</section>

<section class="section">
  <div class="eyebrow">Glitch kit</div>
  <h2>&lt;CrtFilter&gt; &lt;ChromaticImage&gt; &lt;GlitchText&gt; &lt;Oscilloscope&gt;</h2>
  <div class="grid">
    <div class="tile">
      <h3>CrtFilter</h3>
      <CrtFilter><img src={art} alt="Sunset over the sea" /></CrtFilter>
    </div>
    {#each ["crt", "shadow", "jitter", "layers"] as variant (variant)}
      <div class="tile">
        <h3>ChromaticImage {variant}</h3>
        <ChromaticImage src={art} {variant} />
      </div>
    {/each}
    <div class="tile">
      <h3>Oscilloscope</h3>
      <div class="scope-box"><Oscilloscope /></div>
    </div>
    <div class="tile tile-wide">
      <h3>GlitchText</h3>
      <GlitchText class="glitch-title">SIGNAL LOST</GlitchText>
    </div>
  </div>
</section>

<section class="section">
  <div class="eyebrow">Theme wave and pull-cord</div>
  <h2>&lt;ThemeToggle&gt; &lt;PullCord&gt;</h2>
  <p class="lead">The button switches the theme with the wave; the cord at the top right, with a crossfade.</p>
  <ThemeToggle class="button primary">Toggle theme</ThemeToggle>
</section>
