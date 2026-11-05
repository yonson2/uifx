// Page chrome shared by the four demo pages: theme buttons and usage tabs.

import { setTheme } from "@yonson2/uifx";
import { SNIPPETS } from "./snippets.js";

export function setupChrome() {
  for (const button of document.querySelectorAll("[data-theme-set]")) button.addEventListener("click", () => setTheme(button.dataset.themeSet));
  for (const host of document.querySelectorAll("[data-snippets]")) tabs(host, SNIPPETS[host.dataset.snippets]);
}

function tabs(host, snippets) {
  host.classList.add("tabs");
  const list = document.createElement("div");
  list.className = "tab-list";
  list.setAttribute("role", "tablist");
  const buttons = [];
  const panels = [];
  for (const [name, code] of Object.entries(snippets)) {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("role", "tab");
    button.textContent = name;
    const panel = document.createElement("pre");
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-label", `${name} usage`);
    panel.tabIndex = 0;
    panel.textContent = code;
    button.addEventListener("click", () => show(buttons.indexOf(button)));
    buttons.push(button);
    panels.push(panel);
    list.append(button);
  }
  const show = (index) => {
    buttons.forEach((b, i) => b.setAttribute("aria-selected", String(i === index)));
    panels.forEach((p, i) => (p.hidden = i !== index));
  };
  host.append(list, ...panels);
  show(0);
}
