const WAVE_CLASS = "uifx-theme-wave";
const DEFAULTS = { attribute: "data-theme", storageKey: "uifx-theme" };
let latest = null;

/**
 * Runs `update` (the code that changes the theme) inside a view transition.
 * With `wave` (the default), the new theme comes in behind the wave of theme-transition.css;
 * without it, the browser's standard crossfade runs.
 * Without view transitions, or with reduced motion, it runs `update` at once.
 * @param {() => void} update
 * @param {{ wave?: boolean }} [options]
 * @returns {Promise<void>} resolves when the transition has finished
 */
export function transitionTheme(update, { wave = true } = {}) {
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduced) {
    update();
    return Promise.resolve();
  }
  root.classList.toggle(WAVE_CLASS, wave);
  const transition = (latest = document.startViewTransition(update));
  // A newer transition skips this one; only the newest may remove the class.
  return transition.finished.finally(() => latest === transition && root.classList.remove(WAVE_CLASS));
}

/** The theme on `<html>`, else the system preference. */
export function currentTheme({ attribute } = DEFAULTS) {
  const set = document.documentElement.getAttribute(attribute ?? DEFAULTS.attribute);
  if (set) return set;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Sets the theme attribute on `<html>` and remembers it. transition: "wave" (default), "fade" or "none". */
export function setTheme(theme, { attribute = DEFAULTS.attribute, storageKey = DEFAULTS.storageKey, transition = "wave" } = {}) {
  const apply = () => {
    document.documentElement.setAttribute(attribute, theme);
    try {
      localStorage.setItem(storageKey, theme);
    } catch {}
  };
  if (transition === "none") {
    apply();
    return Promise.resolve();
  }
  return transitionTheme(apply, { wave: transition === "wave" });
}

/** Switches between "light" and "dark". */
export function toggleTheme(options = {}) {
  return setTheme(currentTheme(options) === "dark" ? "light" : "dark", options);
}

/** Puts back the remembered theme. Call it early, before the first paint. */
export function restoreTheme({ attribute = DEFAULTS.attribute, storageKey = DEFAULTS.storageKey } = {}) {
  let theme = null;
  try {
    theme = localStorage.getItem(storageKey);
  } catch {}
  if (theme) document.documentElement.setAttribute(attribute, theme);
  return theme;
}
