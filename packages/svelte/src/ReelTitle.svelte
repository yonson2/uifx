<!-- The editable slot-machine title. bind:this gives replay(); onchange gets the rows. -->
<script>
  import { ReelTitle } from "@yonson2/uifx";

  let { rows = ["SPELLING", "RESTORED"], editable = true, autoplay = true, typos = true, onchange, class: className = "", ...rest } = $props();

  let host;
  let engine;

  export function replay() {
    engine?.replay();
  }

  $effect(() => {
    const instance = new ReelTitle(host, { rows: [...rows], editable, autoplay, typos });
    const listen = (event) => onchange?.(event.detail.rows);
    host.addEventListener("reelchange", listen);
    engine = instance;
    return () => {
      host.removeEventListener("reelchange", listen);
      instance.destroy();
    };
  });
</script>

<div bind:this={host} class={["uifx-reel", className]} {...rest}></div>
