import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("./auth-controls", () => ({
  AuthControls: () => <span>Account controls</span>,
}));

import { SiteHeader } from "./site-header";

describe("site header", () => {
  it("keeps the brand and exposes Leaderboard through shared navigation", () => {
    const markup = renderToStaticMarkup(<SiteHeader />);

    expect(markup).toContain('href="/"');
    expect(markup).toContain("JSG Games");
    expect(markup).toContain('aria-label="Site"');
    expect(markup).toContain('href="/leaderboard"');
    expect(markup).toContain("Leaderboard");
    expect(markup).toContain("Account controls");
  });
});
