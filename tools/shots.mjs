// Screenshots of the demo pages, for a visual check.
// Run `npm run build && npx vite preview` first, then: npm run shots [base URL]
// Writes shots/<page>-<theme>.png and reports console errors.

import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:4173/";
const pages = { html: "", react: "react/", vue: "vue/", svelte: "svelte/", mpa: "mpa/", "mpa-other": "mpa/other.html" };
mkdirSync("shots", { recursive: true });

const browser = await chromium.launch();
let failed = false;
for (const theme of ["light", "dark"]) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 860 }, colorScheme: theme });
  for (const [name, path] of Object.entries(pages)) {
    const page = await context.newPage();
    page.on("console", (m) => m.type() === "error" && ((failed = true), console.log(`${name}/${theme} console: ${m.text()}`)));
    page.on("pageerror", (e) => ((failed = true), console.log(`${name}/${theme} error: ${e.message}`)));
    await page.goto(base + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(4500);
    await page.screenshot({ path: `shots/${name}-${theme}.png` });
    await page.screenshot({ path: `shots/${name}-${theme}-full.png`, fullPage: true });
    await page.close();
  }
  await context.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
