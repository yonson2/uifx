import "@fontsource/commit-mono/500.css";
import "@yonson2/uifx/index.css";
import "./shared/site.css";
import { CHARSET, EFFECT_NAMES, PixelField, PullCord, ReelTitle, SCOPE_BLOCKS, SCOPE_WAVE, blockStyle, toggleTheme } from "@yonson2/uifx";
import { setupChrome } from "./shared/chrome.js";

setupChrome();
new PullCord(document.getElementById("cord"));

// Pixel field: the hero, its effect buttons and its text.
const hero = document.getElementById("hero");
let field = new PixelField(hero, { text: "PORTED" });
const effects = document.getElementById("effects");
for (const name of EFFECT_NAMES) {
  const button = document.createElement("button");
  button.className = "button";
  button.type = "button";
  button.dataset.effect = name;
  button.textContent = name;
  effects.append(button);
}
effects.addEventListener("click", (event) => {
  const name = event.target.dataset?.effect;
  if (!name) return;
  field.play(name);
  hero.scrollIntoView({ behavior: "smooth" });
});
document.getElementById("field-text").addEventListener("change", (event) => {
  field.destroy();
  field = new PixelField(hero, { text: event.target.value.toUpperCase() || "PORTED" });
});

// Reel title.
const reelHost = document.getElementById("reel");
const rowsInput = document.getElementById("reel-rows");
let reel = new ReelTitle(reelHost, { rows: ["SPELLING", "RESTORED"] });
const allowed = new RegExp(`[^${CHARSET.replace(/[$?#&]/g, "\\$&")}]`, "g");
rowsInput.addEventListener("change", () => {
  const rows = rowsInput.value
    .toUpperCase()
    .split("/")
    .map((row) => row.replace(allowed, "").slice(0, 10))
    .filter(Boolean)
    .slice(0, 3);
  if (!rows.length) return;
  reel.destroy();
  reel = new ReelTitle(reelHost, { rows });
});
reelHost.addEventListener("reelchange", (event) => (rowsInput.value = event.detail.rows.join(" / ")));
document.getElementById("reel-replay").addEventListener("click", () => reel.replay());

// Glitch kit: the oscilloscopes.
for (const [id, blocks] of [
  ["scope", true],
  ["np-scope", false],
]) {
  const scope = document.getElementById(id);
  scope.innerHTML =
    `<svg viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true"><path class="uifx-scope-path" d="${SCOPE_WAVE}"/></svg>` +
    (blocks ? SCOPE_BLOCKS.map((b) => `<span class="uifx-glitch-block" style="${blockStyle(b)}"></span>`).join("") : "");
}

// Theme wave: toggle and the shape controls.
document.getElementById("wave-toggle").addEventListener("click", () => toggleTheme());
for (const [id, property, unit] of [
  ["wave-humps", "--uifx-wave-humps", ""],
  ["wave-duration", "--uifx-wave-duration", "s"],
  ["wave-amplitude", "--uifx-wave-amplitude", "%"],
]) {
  const input = document.getElementById(id);
  input.addEventListener("input", () => {
    document.documentElement.style.setProperty(property, input.value + unit);
    input.nextElementSibling.value = input.value + unit;
  });
}
