<!-- A button that switches light and dark with the wave transition. -->
<script>
  import { toggleTheme } from "@uifx/core";

  let { children, onclick, ...rest } = $props();

  function click(event) {
    onclick?.(event);
    toggleTheme();
  }
</script>

<button type="button" onclick={click} {...rest}>
  {#if children}{@render children()}{:else}Toggle theme{/if}
</button>
