import "@fontsource/commit-mono/500.css";
import "@uifx/core/index.css";
import "../shared/site.css";
import { crossDocumentTheme, currentTheme, navigateTheme } from "@uifx/core";
import { setupChrome } from "../shared/chrome.js";

crossDocumentTheme();
setupChrome();

// A theme link loads its page with the given theme, or the other theme when it names none.
for (const link of document.querySelectorAll("[data-theme-link]")) {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const theme = link.dataset.themeLink || (currentTheme() === "dark" ? "light" : "dark");
    navigateTheme(theme, { url: link.href });
  });
}
