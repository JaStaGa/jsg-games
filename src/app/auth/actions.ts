"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  validateAuthCredentials,
  type AuthActionState,
} from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const validation = validateAuthCredentials({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validation.success) {
    return { fieldErrors: validation.fieldErrors };
  }

  try {
    const supabase = await createClient();

    // Account-state errors intentionally receive the same check-email outcome
    // so the signup flow does not disclose whether an address is registered.
    await supabase.auth.signUp(validation.credentials);
  } catch {
    return {
      message: "We could not process that request. Please try again later.",
    };
  }

  redirect("/auth/check-email");
}

export async function signIn(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const validation = validateAuthCredentials({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validation.success) {
    return { fieldErrors: validation.fieldErrors };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(
      validation.credentials,
    );

    if (error) {
      return {
        message:
          "Unable to sign in. Check your email, password, and confirmation status.",
      };
    }
  } catch {
    return {
      message: "Unable to sign in right now. Please try again later.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
