<!-- The animated pixel background with a wordmark. bind:this gives play(name). -->
<script>
  import { PixelField } from "@yonson2/uifx";

  let { as = "section", text = "PIXELS", bitmap = null, scale = 2, gap = 1, intro = "rain", ghost = true, onpress = null, class: className = "", children, ...rest } = $props();

  let host;
  let engine;

  export function play(name) {
    engine?.play(name);
  }

  $effect(() => {
    const press = onpress;
    const instance = new PixelField(host, { text, bitmap, scale, gap, intro, ghost, onPress: press ? () => press() : null });
    engine = instance;
    return () => instance.destroy();
  });
</script>

<svelte:element this={as} bind:this={host} class={["uifx-pixel-field", className]} {...rest}>{@render children?.()}</svelte:element>
