import "server-only";
import { createClient } from "@supabase/supabase-js";

const PRIVILEGED_CLIENT_UNAVAILABLE_MESSAGE =
  "Privileged Supabase client is unavailable.";

export function createPrivilegedClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(PRIVILEGED_CLIENT_UNAVAILABLE_MESSAGE);
  }

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
