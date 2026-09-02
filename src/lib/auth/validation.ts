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

type EmailValidationResult =
  | { success: true; email: string }
  | { success: false; error: string };

export function validateEmailAddress(input: unknown): EmailValidationResult {
  const email = typeof input === "string" ? input.trim() : "";

  if (!email) {
    return { success: false, error: "Enter your email address." };
  }

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { success: false, error: "Enter a valid email address." };
  }

  return { success: true, email };
}

export function validateAuthCredentials(input: {
  email: unknown;
  password: unknown;
}): AuthValidationResult {
  const emailValidation = validateEmailAddress(input.email);
  const email = emailValidation.success ? emailValidation.email : "";
  const password = typeof input.password === "string" ? input.password : "";
  const fieldErrors: AuthFieldErrors = {};

  if (!emailValidation.success) {
    fieldErrors.email = emailValidation.error;
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
