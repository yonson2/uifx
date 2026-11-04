<!-- variant: "shadow" (default), "jitter", "layers" or "crt". -->
<script>
  let { src, alt = "", variant = "shadow", class: className = "", ...rest } = $props();
  const names = { shadow: "uifx-chroma", jitter: "uifx-chroma-jitter", crt: "uifx-crt-image" };
</script>

{#if variant === "layers"}
  <span class={["uifx-chroma-layers", className]}>
    <img {src} {alt} {...rest} />
    <img {src} alt="" aria-hidden="true" class="uifx-chroma-red" />
    <img {src} alt="" aria-hidden="true" class="uifx-chroma-cyan" />
  </span>
{:else}
  <img {src} {alt} class={[names[variant], className]} {...rest} />
{/if}
