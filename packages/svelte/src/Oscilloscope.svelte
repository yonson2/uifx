<script>
  import { SCOPE_BLOCKS, SCOPE_WAVE, blockStyle } from "@yonson2/uifx";

  let { blocks = true, class: className = "", ...rest } = $props();
</script>

<div class={["uifx-scope", className]} {...rest}>
  <svg viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true">
    <path class="uifx-scope-path" d={SCOPE_WAVE} />
  </svg>
  {#if blocks}
    {#each SCOPE_BLOCKS as block}
      <span class="uifx-glitch-block" style={blockStyle(block)}></span>
    {/each}
  {/if}
</div>
