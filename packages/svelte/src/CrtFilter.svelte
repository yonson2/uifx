<script>
  let { as = "div", class: className = "", children, ...rest } = $props();
</script>

<svelte:element this={as} class={["uifx-crt", className]} {...rest}>{@render children?.()}</svelte:element>
