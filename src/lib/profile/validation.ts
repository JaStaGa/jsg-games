export const USERNAME_ERROR_MESSAGE =
  "Use 3–20 letters, numbers, or underscores, starting with a letter or number.";
export const USERNAME_PATTERN_SOURCE =
  "[A-Za-z0-9][A-Za-z0-9_]{2,19}";

const USERNAME_PATTERN = new RegExp(`^${USERNAME_PATTERN_SOURCE}$`);

export type ProfileFieldErrors = {
  username?: string;
};

export type ProfileActionState = {
  fieldErrors?: ProfileFieldErrors;
  message?: string;
  status?: "error" | "success";
};

export const INITIAL_PROFILE_ACTION_STATE: ProfileActionState = {};

type UsernameValidationResult =
  | { success: true; username: string }
  | { success: false; fieldErrors: ProfileFieldErrors };

export function validateUsername(input: unknown): UsernameValidationResult {
  if (typeof input !== "string") {
    return {
      success: false,
      fieldErrors: { username: USERNAME_ERROR_MESSAGE },
    };
  }

  const username = input.trim();

  if (!USERNAME_PATTERN.test(username)) {
    return {
      success: false,
      fieldErrors: { username: USERNAME_ERROR_MESSAGE },
    };
  }

  return { success: true, username };
}
