import { describe, expect, it } from "vitest";
import { isSignupConfirmationType } from "./confirmation";

describe("isSignupConfirmationType", () => {
  it("accepts the configured signup email token-hash type", () => {
    expect(isSignupConfirmationType("email")).toBe(true);
  });

  it.each([null, "signup", "invite", "magiclink", "recovery", "email_change"])(
    "rejects unsupported confirmation type %s",
    (type) => {
      expect(isSignupConfirmationType(type)).toBe(false);
    },
  );
});
