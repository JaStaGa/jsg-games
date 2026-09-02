import { beforeEach, describe, expect, it, vi } from "vitest";
import { RECOVERY_SUCCESS_MESSAGE } from "@/lib/auth/recovery";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  headers: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { path });
  }),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { requestPasswordRecovery, updatePassword } from "./recovery-actions";

function recoveryRequestForm(email: string) {
  const formData = new FormData();
  formData.set("email", email);
  return formData;
}

function passwordUpdateForm(password: string, confirmPassword: string) {
  const formData = new FormData();
  formData.set("password", password);
  formData.set("confirmPassword", confirmPassword);
  return formData;
}

describe("requestPasswordRecovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(
      new Headers({ origin: "http://localhost:3000" }),
    );
  });

  it("returns a neutral result and uses the fixed callback URL", async () => {
    const resetPasswordForEmail = vi
      .fn()
      .mockResolvedValue({ data: {}, error: null });
    mocks.createClient.mockResolvedValue({
      auth: { resetPasswordForEmail },
    });

    await expect(
      requestPasswordRecovery({}, recoveryRequestForm(" player@example.com ")),
    ).resolves.toEqual({
      message: RECOVERY_SUCCESS_MESSAGE,
      status: "success",
    });
    expect(resetPasswordForEmail).toHaveBeenCalledWith("player@example.com", {
      redirectTo: "http://localhost:3000/auth/recovery-callback",
    });
  });

  it("keeps service failures generic", async () => {
    mocks.createClient.mockResolvedValue({
      auth: {
        resetPasswordForEmail: vi
          .fn()
          .mockResolvedValue({ data: null, error: new Error("internal") }),
      },
    });

    const result = await requestPasswordRecovery(
      {},
      recoveryRequestForm("player@example.com"),
    );

    expect(result).toEqual({
      message:
        "We could not send a password reset email right now. Please try again later.",
      status: "error",
    });
    expect(JSON.stringify(result)).not.toContain("internal");
  });
});

describe("updatePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an action request without a verified recovery session", async () => {
    mocks.createClient.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
    });

    await expect(
      updatePassword({}, passwordUpdateForm("abcdefgh", "abcdefgh")),
    ).rejects.toMatchObject({ path: "/forgot-password?recovery=invalid" });
  });

  it("updates the password, signs out locally, and requires normal sign-in", async () => {
    const updateUser = vi.fn().mockResolvedValue({ data: {}, error: null });
    const signOut = vi.fn().mockResolvedValue({ error: null });
    mocks.createClient.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { amr: [{ method: "recovery", timestamp: 123 }] } },
          error: null,
        }),
        updateUser,
        signOut,
      },
    });

    await expect(
      updatePassword({}, passwordUpdateForm("abcdefgh", "abcdefgh")),
    ).rejects.toMatchObject({ path: "/login?recovery=complete" });
    expect(updateUser).toHaveBeenCalledWith({ password: "abcdefgh" });
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });
});
