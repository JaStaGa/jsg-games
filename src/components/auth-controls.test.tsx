import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  pathname: "/login",
  useEffect: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mocks.usePathname,
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: mocks.createClient,
}));
vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();

  return { ...react, useEffect: mocks.useEffect };
});

import {
  AuthControls,
  SignedInAuthControls,
  SignedOutAuthControls,
} from "./auth-controls";
import { PublicNavigation } from "./site-header";

type EffectCall = [() => () => void, unknown[]];

describe("header auth controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pathname = "/login";
    mocks.usePathname.mockImplementation(() => mocks.pathname);
  });

  it("keeps signed-in identity, Profile, Stats, and sign-out UI with public navigation", () => {
    const markup = renderToStaticMarkup(
      <>
        <PublicNavigation />
        <SignedInAuthControls identity="player@example.com" />
      </>,
    );

    expect(markup).toContain('href="/leaderboard"');
    expect(markup).toContain("Leaderboard");
    expect(markup).toContain("player@example.com");
    expect(markup).toContain('href="/profile"');
    expect(markup).toContain("Profile");
    expect(markup).toContain('href="/stats"');
    expect(markup).toContain("Stats");
    expect(markup).toContain('action="/auth/signout"');
    expect(markup).toContain("Sign out");
  });

  it("keeps signed-out controls with the same shared public navigation", () => {
    const markup = renderToStaticMarkup(
      <>
        <PublicNavigation />
        <SignedOutAuthControls />
      </>,
    );

    expect(markup).toContain('href="/leaderboard"');
    expect(markup).toContain("Leaderboard");
    expect(markup).toContain('href="/login"');
    expect(markup).toContain("Sign in");
    expect(markup).toContain('href="/signup"');
    expect(markup).toContain("Create account");
    expect(markup).not.toContain('href="/stats"');
    expect(markup).not.toContain("Profile");
    expect(markup).not.toContain("Sign out");
  });

  it("rechecks the cookie-backed session after navigation", () => {
    const unsubscribe = vi.fn();
    const getClaims = vi.fn(
      () => new Promise<never>(() => undefined),
    );
    const onAuthStateChange = vi.fn(() => ({
      data: { subscription: { unsubscribe } },
    }));
    mocks.createClient.mockReturnValue({
      auth: { getClaims, onAuthStateChange },
    });

    renderToStaticMarkup(<AuthControls />);

    const [setupOnLogin, loginDependencies] = mocks.useEffect.mock
      .calls[0] as EffectCall;
    expect(loginDependencies).toEqual(["/login"]);
    const cleanupOnLogin = setupOnLogin();
    expect(getClaims).toHaveBeenCalledTimes(1);

    cleanupOnLogin();
    mocks.pathname = "/";
    renderToStaticMarkup(<AuthControls />);

    const [setupOnHome, homeDependencies] = mocks.useEffect.mock
      .calls[1] as EffectCall;
    expect(homeDependencies).toEqual(["/"]);
    const cleanupOnHome = setupOnHome();
    expect(getClaims).toHaveBeenCalledTimes(2);
    expect(onAuthStateChange).toHaveBeenCalledTimes(2);
    expect(unsubscribe).toHaveBeenCalledTimes(1);

    cleanupOnHome();
  });
});
