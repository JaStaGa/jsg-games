import { runInNewContext } from "node:vm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseTheme, readTheme, saveTheme, THEME_INIT_SCRIPT, THEME_STORAGE_KEY } from "./site-theme";

afterEach(() => vi.unstubAllGlobals());

describe("site appearance preference", () => {
  it.each([null, undefined, "", "system", "LIGHT", " light", {}, 1, "dark", "light"])("validates stored value %j before first paint", (value) => {
    const expected = value === "light" ? "light" : "dark";
    const document = { documentElement: { dataset: { theme: "previous" } } };
    const localStorage = { getItem: vi.fn(() => value) };
    runInNewContext(THEME_INIT_SCRIPT, { document, localStorage });
    vi.stubGlobal("window", { localStorage });
    expect(parseTheme(value)).toBe(expected);
    expect(readTheme()).toBe(expected);
    expect(document.documentElement.dataset.theme).toBe(expected);
    expect(localStorage.getItem).toHaveBeenCalledWith(THEME_STORAGE_KEY);
  });

  it("falls back to dark if accessing storage throws", () => {
    const document = { documentElement: { dataset: { theme: "light" } } };
    const context = { document, get localStorage() { throw new Error("unavailable"); } };
    runInNewContext(THEME_INIT_SCRIPT, context);
    vi.stubGlobal("window", context);
    expect(readTheme()).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("falls back to dark if reading storage throws", () => {
    const document = { documentElement: { dataset: { theme: "light" } } };
    const localStorage = { getItem() { throw new Error("denied"); } };
    runInNewContext(THEME_INIT_SCRIPT, { document, localStorage });
    vi.stubGlobal("window", { localStorage });
    expect(readTheme()).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("still changes the current page when saving is denied", () => {
    const dataset = { theme: "dark" };
    vi.stubGlobal("document", { documentElement: { dataset } });
    vi.stubGlobal("window", { dispatchEvent: vi.fn(), get localStorage() { throw new Error("denied"); } });
    expect(() => saveTheme("light")).not.toThrow();
    expect(dataset.theme).toBe("light");
  });
});
