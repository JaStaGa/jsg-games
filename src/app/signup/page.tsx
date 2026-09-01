import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { signUp } from "@/app/auth/actions";

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="Account access"
      title="Create account"
      description="Create a JSG Games account with your email address. You will need to confirm your email before signing in."
    >
      <AuthForm
        action={signUp}
        alternateHref="/login"
        alternateLabel="Sign in"
        alternatePrompt="Already have an account?"
        passwordAutocomplete="new-password"
        pendingLabel="Creating account…"
        submitLabel="Create account"
      />
    </AuthShell>
  );
}
