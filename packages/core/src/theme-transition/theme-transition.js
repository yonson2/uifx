const WAVE_CLASS = "uifx-theme-wave";
const DEFAULTS = { attribute: "data-theme", storageKey: "uifx-theme" };

/**
 * Runs `update` (the code that changes the theme) inside a view transition,
 * so the new theme comes in behind the wave of theme-transition.css.
 * Without view transitions, or with reduced motion, it runs `update` at once.
 * @param {() => void} update
 * @returns {Promise<void>} resolves when the wave has finished
 */
export function transitionTheme(update) {
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduced) {
    update();
    return Promise.resolve();
  }
  root.classList.add(WAVE_CLASS);
  const transition = document.startViewTransition(update);
  return transition.finished.finally(() => root.classList.remove(WAVE_CLASS));
}

/** The theme on `<html>`, else the system preference. */
export function currentTheme({ attribute } = DEFAULTS) {
  const set = document.documentElement.getAttribute(attribute ?? DEFAULTS.attribute);
  if (set) return set;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Sets the theme attribute on `<html>` with the wave, and remembers it. */
export function setTheme(theme, { attribute = DEFAULTS.attribute, storageKey = DEFAULTS.storageKey, wave = true } = {}) {
  const apply = () => {
    document.documentElement.setAttribute(attribute, theme);
    try {
      localStorage.setItem(storageKey, theme);
    } catch {}
  };
  if (!wave) {
    apply();
    return Promise.resolve();
  }
  return transitionTheme(apply);
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
