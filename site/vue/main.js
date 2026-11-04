import "@fontsource/commit-mono/500.css";
import "@uifx/core/index.css";
import "../shared/site.css";
import { createApp } from "vue";
import { setupChrome } from "../shared/chrome.js";
import App from "./App.vue";

setupChrome();
createApp(App).mount("#app");
