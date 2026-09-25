import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEffect, useRef, useState } from "react";
import { SiteNavigation } from "./site-navigation";
import Link from "next/link";

vi.mock("next/navigation", () => ({ usePathname: () => "/leaderboard" }));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useState: vi.fn(), useEffect: vi.fn(), useRef: vi.fn(), useId: () => "navigation-panel",
}));

beforeEach(() => vi.resetAllMocks());

function view(open = false, pathname = "/leaderboard") {
  const setState = vi.fn(), focus = vi.fn();
  vi.mocked(useState).mockReturnValueOnce([{ open, pathname }, setState]);
  vi.mocked(useRef).mockReturnValueOnce({ current: { focus, getClientRects: () => [1] } })
    .mockReturnValueOnce({ current: { contains: () => true } });
  const element = SiteNavigation({ brand: <Link href="/">JSG Games</Link>, children: <Link href="/login">Sign in</Link> });
  const [, button, panel] = element.props.children;
  return { button, panel, setState, focus };
}

describe("site navigation disclosure", () => {
  it("starts collapsed with a named native button controlling the one panel", () => {
    const { button, panel } = view();
    expect(button.type).toBe("button");
    expect(button.props.children).toBe("Menu");
    expect(button.props["aria-expanded"]).toBe(false);
    expect(button.props["aria-controls"]).toBe(panel.props.id);
    expect(panel.props["data-open"]).toBe(false);
  });
  it("toggles open and closed through native button activation", () => {
    const closed = view();
    closed.button.props.onClick();
    expect(closed.setState).toHaveBeenCalledWith({ pathname: "/leaderboard", open: true });
    const opened = view(true);
    expect(opened.button.props["aria-expanded"]).toBe(true);
    expect(opened.panel.props["data-open"]).toBe(true);
    opened.button.props.onClick();
    expect(opened.setState).toHaveBeenCalledWith({ pathname: "/leaderboard", open: false });
  });
  it("closes on a path change without replacing the children", () => {
    const changed = view(true, "/");
    expect(changed.button.props["aria-expanded"]).toBe(false);
    expect(changed.setState).toHaveBeenCalledWith({ pathname: "/leaderboard", open: false });
    expect(changed.panel.props.children.props.href).toBe("/login");
  });
  it("handles Escape, restores trigger focus, leaves Tab alone and cleans up", () => {
    const doc = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
    vi.stubGlobal("document", doc);
    try {
      const opened = view(true);
      const cleanup = vi.mocked(useEffect).mock.calls[0][0]();
      const handler = doc.addEventListener.mock.calls[0][1];
      const preventDefault = vi.fn();
      handler({ key: "Tab", preventDefault });
      expect(preventDefault).not.toHaveBeenCalled();
      handler({ key: "Escape", preventDefault });
      expect(opened.setState).toHaveBeenCalledWith({ pathname: "/leaderboard", open: false });
      expect(opened.focus).toHaveBeenCalledOnce();
      expect(preventDefault).toHaveBeenCalledOnce();
      if (typeof cleanup === "function") cleanup();
      expect(doc.removeEventListener).toHaveBeenCalledWith("keydown", handler);
    } finally { vi.unstubAllGlobals(); }
  });
});
