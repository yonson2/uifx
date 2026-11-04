<script>
  let { as = "span", class: className = "", children, ...rest } = $props();
</script>

<svelte:element this={as} class={["uifx-glitch-text", className]} {...rest}>{@render children?.()}</svelte:element>
