import {
  MIN_PASSWORD_LENGTH,
  validateEmailAddress,
} from "@/lib/auth/validation";

export const RECOVERY_CALLBACK_PATH = "/auth/recovery-callback";
export const RECOVERY_ERROR_PATH = "/forgot-password?recovery=invalid";
export const RECOVERY_SUCCESS_MESSAGE =
  "If an account exists for that email, check your inbox for a password reset link.";

export type RecoveryRequestActionState = {
  fieldErrors?: { email?: string };
  message?: string;
  status?: "error" | "success";
};

export type PasswordUpdateActionState = {
  fieldErrors?: {
    password?: string;
    confirmPassword?: string;
  };
  message?: string;
};

export const INITIAL_RECOVERY_REQUEST_STATE: RecoveryRequestActionState = {};
export const INITIAL_PASSWORD_UPDATE_STATE: PasswordUpdateActionState = {};

type RecoveryEmailValidationResult =
  | { success: true; email: string }
  | { success: false; fieldErrors: { email: string } };

type NewPasswordValidationResult =
  | { success: true; password: string }
  | {
      success: false;
      fieldErrors: NonNullable<PasswordUpdateActionState["fieldErrors"]>;
    };

export function validateRecoveryEmail(
  input: unknown,
): RecoveryEmailValidationResult {
  const result = validateEmailAddress(input);

  return result.success
    ? result
    : { success: false, fieldErrors: { email: result.error } };
}

export function validateNewPassword(input: {
  password: unknown;
  confirmPassword: unknown;
}): NewPasswordValidationResult {
  const password = typeof input.password === "string" ? input.password : "";
  const confirmPassword =
    typeof input.confirmPassword === "string" ? input.confirmPassword : "";
  const fieldErrors: NonNullable<
    PasswordUpdateActionState["fieldErrors"]
  > = {};

  if (!password) {
    fieldErrors.password = "Enter a new password.";
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    fieldErrors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (!confirmPassword) {
    fieldErrors.confirmPassword = "Confirm your new password.";
  } else if (password && confirmPassword !== password) {
    fieldErrors.confirmPassword = "Passwords do not match.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors };
  }

  return { success: true, password };
}

export function buildRecoveryRedirectUrl(origin: string | null): string | null {
  if (!origin) return null;

  try {
    const parsedOrigin = new URL(origin);

    if (
      (parsedOrigin.protocol !== "http:" && parsedOrigin.protocol !== "https:") ||
      parsedOrigin.username ||
      parsedOrigin.password ||
      parsedOrigin.pathname !== "/" ||
      parsedOrigin.search ||
      parsedOrigin.hash
    ) {
      return null;
    }

    return new URL(RECOVERY_CALLBACK_PATH, parsedOrigin.origin).toString();
  } catch {
    return null;
  }
}

export function hasRecoveryAuthenticationMethod(claims: unknown): boolean {
  if (!claims || typeof claims !== "object") return false;

  const amr = (claims as { amr?: unknown }).amr;
  if (!Array.isArray(amr)) return false;

  return amr.some((entry) => {
    if (entry === "recovery") return true;
    if (!entry || typeof entry !== "object") return false;

    return (entry as { method?: unknown }).method === "recovery";
  });
}
