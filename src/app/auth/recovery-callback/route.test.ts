import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { GET } from "./route";

describe("recovery callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles a missing authorization code safely", async () => {
    const response = await GET(
      new NextRequest("http://localhost:3000/auth/recovery-callback"),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/forgot-password?recovery=invalid",
    );
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("handles an invalid or reused authorization code safely", async () => {
    mocks.createClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi
          .fn()
          .mockResolvedValue({ data: null, error: new Error("expired code") }),
      },
    });

    const response = await GET(
      new NextRequest(
        "http://localhost:3000/auth/recovery-callback?code=secret-code",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/forgot-password?recovery=invalid",
    );
    expect(response.headers.get("location")).not.toContain("secret-code");
  });

  it("exchanges a recovery code and redirects to the fixed update route", async () => {
    const exchangeCodeForSession = vi
      .fn()
      .mockResolvedValue({ data: {}, error: null });
    mocks.createClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession,
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { amr: ["recovery"] } },
          error: null,
        }),
      },
    });

    const response = await GET(
      new NextRequest(
        "http://localhost:3000/auth/recovery-callback?code=secret-code&sb_flow_id=123e4567-e89b-12d3-a456-426614174000",
      ),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("secret-code", {
      flowId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/update-password",
    );
  });

  it("clears an exchanged session that lacks a recovery claim", async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    mocks.createClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi
          .fn()
          .mockResolvedValue({ data: {}, error: null }),
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { amr: ["password"] } },
          error: null,
        }),
        signOut,
      },
    });

    const response = await GET(
      new NextRequest(
        "http://localhost:3000/auth/recovery-callback?code=secret-code",
      ),
    );

    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/forgot-password?recovery=invalid",
    );
  });
});
