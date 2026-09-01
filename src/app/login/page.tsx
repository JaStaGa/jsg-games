import { signIn } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Account access"
      title="Sign in"
      description="Sign in with your confirmed JSG Games email address and password."
    >
      <AuthForm
        action={signIn}
        alternateHref="/signup"
        alternateLabel="Create account"
        alternatePrompt="New to JSG Games?"
        passwordAutocomplete="current-password"
        pendingLabel="Signing in…"
        submitLabel="Sign in"
      />
    </AuthShell>
  );
}
