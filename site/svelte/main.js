import "@fontsource/commit-mono/500.css";
import "@yonson2/uifx/index.css";
import "../shared/site.css";
import { mount } from "svelte";
import { setupChrome } from "../shared/chrome.js";
import App from "./App.svelte";

setupChrome();
mount(App, { target: document.getElementById("app") });
