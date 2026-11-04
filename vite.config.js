import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const root = resolve(import.meta.dirname, "site");

export default defineConfig({
  root,
  // Relative URLs, so the build works under any GitHub Pages path (/<repo>/).
  base: "./",
  plugins: [react(), vue(), svelte()],
  input: {
    main: resolve(root, "index.html"),
    react: resolve(root, "react/index.html"),
    vue: resolve(root, "vue/index.html"),
    svelte: resolve(root, "svelte/index.html"),
  },
  build: {
    outDir: resolve(root, "dist"),
    emptyOutDir: true,
  },
  test: {
    root: import.meta.dirname,
    include: ["tests/**/*.test.js"],
  },
});
