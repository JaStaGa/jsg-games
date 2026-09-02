import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { UpdatePasswordForm } from "@/components/update-password-form";
import {
  hasRecoveryAuthenticationMethod,
  RECOVERY_ERROR_PATH,
} from "@/lib/auth/recovery";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage() {
  let hasRecoverySession = false;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    hasRecoverySession =
      !error && hasRecoveryAuthenticationMethod(data?.claims);
  } catch {
    // Invalid and expired sessions use the same controlled recovery state.
  }

  if (!hasRecoverySession) {
    redirect(RECOVERY_ERROR_PATH);
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Choose a new password"
      description="Set a new password for your JSG Games account. You will sign in normally after the update."
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
