# @uifx/vue

Vue 3 components for [@uifx/core](https://www.npmjs.com/package/@uifx/core).

```sh
npm install @uifx/vue
```

```vue
<script setup>
import "@uifx/core/index.css";
import { PullCord, ReelTitle, ThemeToggle } from "@uifx/vue";
</script>

<template>
  <ReelTitle :rows="['SPELLING', 'RESTORED']" @change="(rows) => {}" />
  <PullCord />
  <ThemeToggle>Toggle theme</ThemeToggle>
</template>
```

Docs, usage and credits: <https://github.com/yonson2/uifx>. Live demo: <https://yonson2.github.io/uifx/>.

MIT licence. The effects are credited rewrites; see the main README for the original authors.
