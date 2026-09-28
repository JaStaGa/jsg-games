import { afterEach, describe, expect, it, vi } from "vitest";
import { useSyncExternalStore } from "react";
import { AppearanceControl } from "./appearance-control";
import { THEME_STORAGE_KEY } from "../lib/site-theme";

vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useLayoutEffect: vi.fn(),
  useSyncExternalStore: vi.fn(),
}));

afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("appearance control", () => {
  it("is a labelled native Dark/Light select that updates and persists both choices", () => {
    const dataset = { theme: "dark" };
    const localStorage = { setItem: vi.fn() };
    const events = new EventTarget();
    vi.stubGlobal("document", { documentElement: { dataset } });
    vi.stubGlobal("window", Object.assign(events, { localStorage }));
    vi.mocked(useSyncExternalStore).mockReturnValue("dark");
    const label = AppearanceControl();
    const select = label.props.children[1];
    expect(label.type).toBe("label");
    expect(label.props.children[0]).toBe("Appearance");
    expect(select.type).toBe("select");
    expect(select.props.children.map((option: { props: { value: string } }) => option.props.value)).toEqual(["dark", "light"]);
    const [subscribe, snapshot, serverSnapshot] = vi.mocked(useSyncExternalStore).mock.calls[0];
    const notify = vi.fn();
    const cleanup = subscribe(notify);
    expect(serverSnapshot!()).toBe("dark");
    for (const value of ["light", "dark"]) {
      select.props.onChange({ target: { value } });
      expect(dataset.theme).toBe(value);
      expect(snapshot()).toBe(value);
      expect(localStorage.setItem).toHaveBeenLastCalledWith(THEME_STORAGE_KEY, value);
    }
    expect(notify).toHaveBeenCalledTimes(2);
    cleanup();
    select.props.onChange({ target: { value: "light" } });
    expect(notify).toHaveBeenCalledTimes(2);
  });
});
