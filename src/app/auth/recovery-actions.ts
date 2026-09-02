"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  buildRecoveryRedirectUrl,
  hasRecoveryAuthenticationMethod,
  RECOVERY_ERROR_PATH,
  RECOVERY_SUCCESS_MESSAGE,
  validateNewPassword,
  validateRecoveryEmail,
  type PasswordUpdateActionState,
  type RecoveryRequestActionState,
} from "@/lib/auth/recovery";
import { createClient } from "@/lib/supabase/server";

const RECOVERY_REQUEST_ERROR_MESSAGE =
  "We could not send a password reset email right now. Please try again later.";
const PASSWORD_UPDATE_ERROR_MESSAGE =
  "We could not update your password right now. Please try again later.";

export async function requestPasswordRecovery(
  _state: RecoveryRequestActionState,
  formData: FormData,
): Promise<RecoveryRequestActionState> {
  const validation = validateRecoveryEmail(formData.get("email"));

  if (!validation.success) {
    return { fieldErrors: validation.fieldErrors, status: "error" };
  }

  let redirectTo: string | null = null;

  try {
    const requestHeaders = await headers();
    redirectTo = buildRecoveryRedirectUrl(requestHeaders.get("origin"));
  } catch {
    // A missing or malformed request origin is handled as a generic failure.
  }

  if (!redirectTo) {
    return { message: RECOVERY_REQUEST_ERROR_MESSAGE, status: "error" };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
      validation.email,
      { redirectTo },
    );

    if (error) {
      return { message: RECOVERY_REQUEST_ERROR_MESSAGE, status: "error" };
    }
  } catch {
    return { message: RECOVERY_REQUEST_ERROR_MESSAGE, status: "error" };
  }

  return { message: RECOVERY_SUCCESS_MESSAGE, status: "success" };
}

export async function updatePassword(
  _state: PasswordUpdateActionState,
  formData: FormData,
): Promise<PasswordUpdateActionState> {
  const validation = validateNewPassword({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validation.success) {
    return { fieldErrors: validation.fieldErrors };
  }

  let supabase: Awaited<ReturnType<typeof createClient>>;

  try {
    supabase = await createClient();
  } catch {
    return { message: PASSWORD_UPDATE_ERROR_MESSAGE };
  }

  let hasRecoverySession = false;

  try {
    const { data, error } = await supabase.auth.getClaims();
    hasRecoverySession =
      !error && hasRecoveryAuthenticationMethod(data?.claims);
  } catch {
    // The fixed recovery error route handles invalid or expired sessions.
  }

  if (!hasRecoverySession) {
    redirect(RECOVERY_ERROR_PATH);
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: validation.password,
    });

    if (error) {
      return { message: PASSWORD_UPDATE_ERROR_MESSAGE };
    }
  } catch {
    return { message: PASSWORD_UPDATE_ERROR_MESSAGE };
  }

  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // auth-js clears the local session for ordinary sign-out failures. The
    // password is already changed, so continue to the required normal sign-in.
  }

  revalidatePath("/", "layout");
  redirect("/login?recovery=complete");
}
