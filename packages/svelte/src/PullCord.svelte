<!-- The ceiling pull-cord. A pull toggles the theme with a crossfade, or calls onpull when given. -->
<script>
  import { untrack } from "svelte";
  import { CORD_CONFIG, PullCord } from "@uifx/core";

  let { onpull = null, label = "Toggle theme", pressed = null, entrance = true, config = {}, class: className = "", ...rest } = $props();

  let host;
  let engine;

  $effect(() => {
    const pull = onpull;
    const options = untrack(() => ({ label, pressed, config }));
    const instance = new PullCord(host, { ...options, entrance, ...(pull && { onPull: () => pull() }) });
    engine = instance;
    return () => instance.destroy();
  });

  $effect(() => engine?.setLabel(label));
  $effect(() => engine?.setPressed(pressed));
  $effect(() => engine?.setConfig({ ...CORD_CONFIG, ...config }));
</script>

<div bind:this={host} class={["uifx-pull-cord", className]} {...rest}></div>
