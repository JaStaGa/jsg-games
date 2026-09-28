"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { applyTheme, parseTheme, readTheme, saveTheme } from "../lib/site-theme";
import styles from "./appearance-control.module.css";

function subscribe(onChange: () => void) {
  window.addEventListener("jsg-theme-change", onChange);
  return () => window.removeEventListener("jsg-theme-change", onChange);
}

function getSnapshot() {
  return parseTheme(document.documentElement.dataset.theme);
}

function getServerSnapshot() {
  return "dark" as const;
}

export function AppearanceControl() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useLayoutEffect(() => {
    // React's development Strict Mode remount can reset root attributes.
    applyTheme(readTheme());
  }, []);

  return (
    <label className={styles.control}>
      Appearance
      <select value={theme} onChange={(event) => saveTheme(parseTheme(event.target.value))}>
        <option value="dark">Dark</option>
        <option value="light">Light</option>
      </select>
    </label>
  );
}
