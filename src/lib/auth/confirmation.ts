export function isSignupConfirmationType(type: string | null): type is "email" {
  return type === "email";
}
