# @yonson2/uifx-svelte

Svelte 5 components for [@yonson2/uifx](https://www.npmjs.com/package/@yonson2/uifx).

```sh
npm install @yonson2/uifx-svelte
```

```svelte
<script>
  import "@yonson2/uifx/index.css";
  import { PullCord, ReelTitle, ThemeToggle } from "@yonson2/uifx-svelte";
</script>

<ReelTitle rows={["SPELLING", "RESTORED"]} onchange={(rows) => {}} />
<PullCord />
<ThemeToggle>Toggle theme</ThemeToggle>
```

Docs, usage and credits: <https://github.com/yonson2/uifx>. Live demo: <https://yonson2.github.io/uifx/>.

MIT licence. The effects are credited rewrites; see the main README for the original authors.
