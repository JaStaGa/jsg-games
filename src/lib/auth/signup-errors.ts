const AMBIGUOUS_ACCOUNT_ERROR_CODES = new Set([
  "email_exists",
  "user_already_exists",
]);

export function isAmbiguousSignupErrorCode(
  code: string | null | undefined,
): boolean {
  return typeof code === "string" && AMBIGUOUS_ACCOUNT_ERROR_CODES.has(code);
}
