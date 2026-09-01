import { describe, expect, it } from "vitest";
import { isAmbiguousSignupErrorCode } from "./signup-errors";

describe("isAmbiguousSignupErrorCode", () => {
  it.each(["email_exists", "user_already_exists"])(
    "treats %s as account-state ambiguity",
    (code) => {
      expect(isAmbiguousSignupErrorCode(code)).toBe(true);
    },
  );

  it.each([
    "over_email_send_rate_limit",
    "signup_disabled",
    "email_address_invalid",
  ])("does not treat operational error %s as account-state ambiguity", (code) => {
    expect(isAmbiguousSignupErrorCode(code)).toBe(false);
  });

  it.each([null, undefined, "", "unknown_error"])(
    "does not silently classify unknown code %s as account-state ambiguity",
    (code) => {
      expect(isAmbiguousSignupErrorCode(code)).toBe(false);
    },
  );
});
