<!-- The spot the pixel field draws its wordmark into. Put it inside <PixelField>. -->
<script>
  let { class: className = "", ...rest } = $props();
</script>

<div data-pf-wordmark class={["uifx-pixel-field-wordmark", className]} {...rest}></div>
