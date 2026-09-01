import { describe, expect, it } from "vitest";
import {
  MIN_PASSWORD_LENGTH,
  validateAuthCredentials,
} from "./validation";

describe("validateAuthCredentials", () => {
  it("requires an email address", () => {
    const result = validateAuthCredentials({
      email: "",
      password: "abcdefgh",
    });

    expect(result).toEqual({
      success: false,
      fieldErrors: { email: "Enter your email address." },
    });
  });

  it("rejects an implausible email address", () => {
    const result = validateAuthCredentials({
      email: "not-an-email",
      password: "abcdefgh",
    });

    expect(result).toEqual({
      success: false,
      fieldErrors: { email: "Enter a valid email address." },
    });
  });

  it("requires a password", () => {
    const result = validateAuthCredentials({
      email: "player@example.com",
      password: "",
    });

    expect(result).toEqual({
      success: false,
      fieldErrors: { password: "Enter your password." },
    });
  });

  it("rejects a password just below the eight-character boundary", () => {
    const result = validateAuthCredentials({
      email: "player@example.com",
      password: "a".repeat(MIN_PASSWORD_LENGTH - 1),
    });

    expect(result).toEqual({
      success: false,
      fieldErrors: { password: "Use at least 8 characters." },
    });
  });

  it("accepts exactly eight lowercase characters without extra complexity", () => {
    expect(
      validateAuthCredentials({
        email: " player@example.com ",
        password: "abcdefgh",
      }),
    ).toEqual({
      success: true,
      credentials: {
        email: "player@example.com",
        password: "abcdefgh",
      },
    });
  });

  it("does not trim or otherwise rewrite a valid password", () => {
    expect(
      validateAuthCredentials({
        email: "player@example.com",
        password: "  secret  ",
      }),
    ).toEqual({
      success: true,
      credentials: {
        email: "player@example.com",
        password: "  secret  ",
      },
    });
  });
});
