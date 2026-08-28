export const MIN_PASSWORD_LENGTH = 8;

export type AuthFieldErrors = {
  email?: string;
  password?: string;
};

export type AuthActionState = {
  fieldErrors?: AuthFieldErrors;
  message?: string;
};

export const INITIAL_AUTH_ACTION_STATE: AuthActionState = {};

type AuthCredentials = {
  email: string;
  password: string;
};

type AuthValidationResult =
  | { success: true; credentials: AuthCredentials }
  | { success: false; fieldErrors: AuthFieldErrors };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuthCredentials(input: {
  email: unknown;
  password: unknown;
}): AuthValidationResult {
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const password = typeof input.password === "string" ? input.password : "";
  const fieldErrors: AuthFieldErrors = {};

  if (!email) {
    fieldErrors.email = "Enter your email address.";
  } else if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (!password) {
    fieldErrors.password = "Enter your password.";
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    fieldErrors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors };
  }

  return {
    success: true,
    credentials: { email, password },
  };
}
