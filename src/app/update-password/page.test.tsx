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

import UpdatePasswordPage from "./page";

describe("update password page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated direct access", async () => {
    mocks.createClient.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
    });

    await expect(UpdatePasswordPage()).rejects.toMatchObject({
      path: "/forgot-password?recovery=invalid",
    });
  });

  it("rejects an ordinary signed-in session", async () => {
    mocks.createClient.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { amr: [{ method: "password", timestamp: 123 }] } },
          error: null,
        }),
      },
    });

    await expect(UpdatePasswordPage()).rejects.toMatchObject({
      path: "/forgot-password?recovery=invalid",
    });
  });
});
