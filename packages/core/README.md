# @yonson2/uifx

Framework-free web effects: a theme wave transition, a CSS glitch kit, an editable reel
title, a pixel field and a pull-cord. Plain ES modules and CSS, with TypeScript types.

```sh
npm install @yonson2/uifx
```

```js
import "@yonson2/uifx/index.css";
import { PullCord, ReelTitle, toggleTheme } from "@yonson2/uifx";

new ReelTitle(document.querySelector("#title"), { rows: ["SPELLING", "RESTORED"] });
new PullCord(document.querySelector("#cord"));
button.onclick = () => toggleTheme(); // the wave
```

Docs, usage and credits: <https://github.com/yonson2/uifx>. Live demo: <https://yonson2.github.io/uifx/>.

MIT licence. The effects are credited rewrites; see the main README for the original authors.
