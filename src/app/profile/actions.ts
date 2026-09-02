"use server";

import { revalidatePath } from "next/cache";
import {
  validateUsername,
  type ProfileActionState,
} from "@/lib/profile/validation";
import { createClient } from "@/lib/supabase/server";

const PROFILE_SAVE_ERROR_MESSAGE =
  "We could not save your profile right now. Please try again later.";
const PROFILE_SESSION_ERROR_MESSAGE =
  "Your session has expired. Sign in again to save your profile.";
const USERNAME_UNAVAILABLE_MESSAGE = "That username is unavailable.";

type AuthenticatedClientResult =
  | {
      success: true;
      supabase: Awaited<ReturnType<typeof createClient>>;
      userId: string;
    }
  | { success: false; state: ProfileActionState };

async function getAuthenticatedClient(): Promise<AuthenticatedClientResult> {
  let supabase: Awaited<ReturnType<typeof createClient>>;

  try {
    supabase = await createClient();
  } catch {
    return {
      success: false,
      state: { message: PROFILE_SAVE_ERROR_MESSAGE, status: "error" },
    };
  }

  try {
    const { data, error } = await supabase.auth.getClaims();
    const subject = data?.claims?.sub;

    if (error || typeof subject !== "string" || !subject) {
      return {
        success: false,
        state: { message: PROFILE_SESSION_ERROR_MESSAGE, status: "error" },
      };
    }

    return { success: true, supabase, userId: subject };
  } catch {
    return {
      success: false,
      state: { message: PROFILE_SESSION_ERROR_MESSAGE, status: "error" },
    };
  }
}

function databaseErrorState(error: { code?: string } | null) {
  if (error?.code === "23505") {
    return {
      message: USERNAME_UNAVAILABLE_MESSAGE,
      status: "error" as const,
    };
  }

  return { message: PROFILE_SAVE_ERROR_MESSAGE, status: "error" as const };
}

export async function createProfile(
  _state: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const authenticated = await getAuthenticatedClient();

  if (!authenticated.success) {
    return authenticated.state;
  }

  const validation = validateUsername(formData.get("username"));

  if (!validation.success) {
    return { fieldErrors: validation.fieldErrors, status: "error" };
  }

  try {
    const { error } = await authenticated.supabase.from("profiles").insert({
      id: authenticated.userId,
      username: validation.username,
    });

    if (error) {
      return databaseErrorState(error);
    }
  } catch {
    return databaseErrorState(null);
  }

  revalidatePath("/profile");
  return { message: "Profile created.", status: "success" };
}

export async function updateProfile(
  _state: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const authenticated = await getAuthenticatedClient();

  if (!authenticated.success) {
    return authenticated.state;
  }

  const validation = validateUsername(formData.get("username"));

  if (!validation.success) {
    return { fieldErrors: validation.fieldErrors, status: "error" };
  }

  try {
    const { error } = await authenticated.supabase
      .from("profiles")
      .update({ username: validation.username })
      .eq("id", authenticated.userId);

    if (error) {
      return databaseErrorState(error);
    }
  } catch {
    return databaseErrorState(null);
  }

  revalidatePath("/profile");
  return { message: "Username updated.", status: "success" };
}
