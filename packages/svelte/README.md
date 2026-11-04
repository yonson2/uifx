# @uifx/svelte

Svelte 5 components for [@uifx/core](https://www.npmjs.com/package/@uifx/core).

```sh
npm install @uifx/svelte
```

```svelte
<script>
  import "@uifx/core/index.css";
  import { PullCord, ReelTitle, ThemeToggle } from "@uifx/svelte";
</script>

<ReelTitle rows={["SPELLING", "RESTORED"]} onchange={(rows) => {}} />
<PullCord />
<ThemeToggle>Toggle theme</ThemeToggle>
```

Docs, usage and credits: <https://github.com/yonson2/uifx>. Live demo: <https://yonson2.github.io/uifx/>.

MIT licence. The effects are credited rewrites; see the main README for the original authors.
