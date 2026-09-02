import { describe, expect, it } from "vitest";
import {
  buildRecoveryRedirectUrl,
  hasRecoveryAuthenticationMethod,
  validateNewPassword,
  validateRecoveryEmail,
} from "./recovery";

describe("validateRecoveryEmail", () => {
  it("requires an email address", () => {
    expect(validateRecoveryEmail("  ")).toEqual({
      success: false,
      fieldErrors: { email: "Enter your email address." },
    });
  });

  it("rejects an implausible email address", () => {
    expect(validateRecoveryEmail("not-an-email")).toEqual({
      success: false,
      fieldErrors: { email: "Enter a valid email address." },
    });
  });

  it("trims and accepts a plausible email address", () => {
    expect(validateRecoveryEmail(" player@example.com ")).toEqual({
      success: true,
      email: "player@example.com",
    });
  });
});

describe("validateNewPassword", () => {
  it("requires both password fields", () => {
    expect(
      validateNewPassword({ password: "", confirmPassword: "" }),
    ).toEqual({
      success: false,
      fieldErrors: {
        password: "Enter a new password.",
        confirmPassword: "Confirm your new password.",
      },
    });
  });

  it("rejects a password shorter than eight characters", () => {
    expect(
      validateNewPassword({ password: "abcdefg", confirmPassword: "abcdefg" }),
    ).toEqual({
      success: false,
      fieldErrors: { password: "Use at least 8 characters." },
    });
  });

  it("rejects a confirmation mismatch", () => {
    expect(
      validateNewPassword({
        password: "abcdefgh",
        confirmPassword: "abcdefgi",
      }),
    ).toEqual({
      success: false,
      fieldErrors: { confirmPassword: "Passwords do not match." },
    });
  });

  it("accepts exactly eight lowercase characters without extra complexity", () => {
    expect(
      validateNewPassword({
        password: "abcdefgh",
        confirmPassword: "abcdefgh",
      }),
    ).toEqual({ success: true, password: "abcdefgh" });
  });
});

describe("buildRecoveryRedirectUrl", () => {
  it("builds the fixed callback from an HTTP application origin", () => {
    expect(buildRecoveryRedirectUrl("http://localhost:3000")).toBe(
      "http://localhost:3000/auth/recovery-callback",
    );
  });

  it("rejects malformed or non-HTTP origins", () => {
    expect(buildRecoveryRedirectUrl("javascript:alert(1)")).toBeNull();
    expect(buildRecoveryRedirectUrl("https://example.com/other")).toBeNull();
    expect(buildRecoveryRedirectUrl(null)).toBeNull();
  });
});

describe("hasRecoveryAuthenticationMethod", () => {
  it("accepts current object and RFC string AMR formats", () => {
    expect(
      hasRecoveryAuthenticationMethod({
        amr: [{ method: "recovery", timestamp: 123 }],
      }),
    ).toBe(true);
    expect(hasRecoveryAuthenticationMethod({ amr: ["recovery"] })).toBe(true);
  });

  it("rejects missing and ordinary password authentication methods", () => {
    expect(hasRecoveryAuthenticationMethod(null)).toBe(false);
    expect(
      hasRecoveryAuthenticationMethod({
        amr: [{ method: "password", timestamp: 123 }],
      }),
    ).toBe(false);
  });
});
