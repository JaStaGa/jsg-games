import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { path });
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import ProfilePage from "./page";

const USER_ID = "11111111-1111-1111-1111-111111111111";

function mockSignedInProfile(profile: { username: string } | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: profile, error: null });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  mocks.createClient.mockResolvedValue({
    auth: {
      getClaims: vi.fn().mockResolvedValue({
        data: { claims: { sub: USER_ID } },
        error: null,
      }),
    },
    from,
  });

  return { eq, from, select };
}

describe("profile page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects a signed-out visitor to the fixed login route", async () => {
    mocks.createClient.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
    });

    await expect(ProfilePage()).rejects.toMatchObject({ path: "/login" });
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("shows profile creation without browser-native username validation", async () => {
    const query = mockSignedInProfile(null);

    const markup = renderToStaticMarkup(await ProfilePage());
    const usernameInput = markup.match(
      /<input[^>]*name="username"[^>]*>/,
    )?.[0];

    if (!usernameInput) {
      throw new Error("Expected the profile form to render a username input.");
    }

    expect(markup).toContain("Create your profile");
    expect(markup).toContain("Create profile");
    expect(usernameInput).not.toMatch(
      /\s(?:maxLength|minLength|pattern|required)(?:=|\s|>)/i,
    );
    expect(query.from).toHaveBeenCalledWith("profiles");
    expect(query.select).toHaveBeenCalledWith("username");
    expect(query.eq).toHaveBeenCalledWith("id", USER_ID);
  });

  it("shows the existing username and rename form", async () => {
    mockSignedInProfile({ username: "PlayerOne" });

    const markup = renderToStaticMarkup(await ProfilePage());

    expect(markup).toContain("Your profile");
    expect(markup).toContain("Current username");
    expect(markup).toContain("PlayerOne");
    expect(markup).toContain("Save username");
  });
});
