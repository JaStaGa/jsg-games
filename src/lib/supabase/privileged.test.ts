import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createSupabaseClient: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createSupabaseClient,
}));

import { createPrivilegedClient } from "./privileged";

describe("privileged Supabase client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses only server configuration and disables Auth session state", () => {
    const client = { privileged: true };
    mocks.createSupabaseClient.mockReturnValue(client);
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      "https://project-ref.supabase.co",
    );
    vi.stubEnv("SUPABASE_SECRET_KEY", "server-only-test-secret");

    expect(createPrivilegedClient()).toBe(client);
    expect(mocks.createSupabaseClient).toHaveBeenCalledWith(
      "https://project-ref.supabase.co",
      "server-only-test-secret",
      {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
      },
    );
  });

  it.each([
    ["NEXT_PUBLIC_SUPABASE_URL", "", "SUPABASE_SECRET_KEY", "configured"],
    ["NEXT_PUBLIC_SUPABASE_URL", "configured", "SUPABASE_SECRET_KEY", ""],
  ])("fails generically when server configuration is incomplete", (urlName, url, secretName, secret) => {
    vi.stubEnv(urlName, url);
    vi.stubEnv(secretName, secret);

    expect(() => createPrivilegedClient()).toThrow(
      "Privileged Supabase client is unavailable.",
    );
    expect(mocks.createSupabaseClient).not.toHaveBeenCalled();
  });
});
