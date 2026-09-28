export type SiteTheme = "dark" | "light";
export const THEME_STORAGE_KEY = "jsg-theme";

export function parseTheme(value: unknown): SiteTheme {
  return value === "light" ? "light" : "dark";
}

export function readTheme(): SiteTheme {
  try {
    return parseTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "dark";
  }
}

export function applyTheme(theme: SiteTheme) {
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new Event("jsg-theme-change"));
}

export function saveTheme(theme: SiteTheme) {
  applyTheme(theme);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The current page still works when persistence is unavailable.
  }
}

// Runs synchronously in <head>, before body parsing or React hydration.
// Keep this small, static, and equivalent to readTheme (including storage errors).
export const THEME_INIT_SCRIPT = `(()=>{let theme="dark";try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="light")theme="light"}catch{}document.documentElement.dataset.theme=theme})()`;
