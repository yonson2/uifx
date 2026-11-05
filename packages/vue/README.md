# @yonson2/uifx-vue

Vue 3 components for [@yonson2/uifx](https://www.npmjs.com/package/@yonson2/uifx).

```sh
npm install @yonson2/uifx-vue
```

```vue
<script setup>
import "@yonson2/uifx/index.css";
import { PullCord, ReelTitle, ThemeToggle } from "@yonson2/uifx-vue";
</script>

<template>
  <ReelTitle :rows="['SPELLING', 'RESTORED']" @change="(rows) => {}" />
  <PullCord />
  <ThemeToggle>Toggle theme</ThemeToggle>
</template>
```

Docs, usage and credits: <https://github.com/yonson2/uifx>. Live demo: <https://yonson2.github.io/uifx/>.

MIT licence. The effects are credited rewrites; see the main README for the original authors.
