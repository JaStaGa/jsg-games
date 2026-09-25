import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ signedIn: false }));
vi.mock("./auth-controls", async (original) => {
  const { SignedInAuthControls, SignedOutAuthControls } =
    await original<typeof import("./auth-controls")>();
  return {
    AuthControls: () => auth.signedIn
      ? <SignedInAuthControls identity="player@example.com" />
      : <SignedOutAuthControls />,
  };
});
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

import { SiteHeader } from "./site-header";

describe("site header", () => {
  it("keeps the brand and exposes Leaderboard through shared navigation", () => {
    const markup = renderToStaticMarkup(<SiteHeader />);

    expect(markup).toContain('href="/"');
    expect(markup).toContain("JSG Games");
    expect(markup).toContain('aria-label="Site"');
    expect(markup).toContain('href="/leaderboard"');
    expect(markup).toContain("Leaderboard");
    expect(markup.match(/href="\/login"/g)).toHaveLength(1);
    expect(markup.match(/href="\/signup"/g)).toHaveLength(1);
    expect(markup).not.toContain("Foundation");
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('>Menu</button>');
  });
  it("contains one signed-in account UI inside the same collapsed panel", () => {
    auth.signedIn = true;
    try {
      const markup = renderToStaticMarkup(<SiteHeader />);
      expect(markup).toContain('data-open="false"');
      expect(markup).toContain("player@example.com");
      for (const href of ["/leaderboard", "/profile", "/stats"]) {
        expect(markup.split(`href="${href}"`)).toHaveLength(2);
      }
      expect(markup.match(/action="\/auth\/signout"/g)).toHaveLength(1);
      expect(markup).toContain('method="post"');
      expect(markup).not.toContain('href="/login"');
      expect(markup).not.toContain("Foundation");
    } finally { auth.signedIn = false; }
  });
});
