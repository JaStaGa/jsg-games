import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { ProfileForm } from "@/components/profile-form";
import styles from "@/components/auth-shell.module.css";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;
  let userId: string | null = null;

  try {
    supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    const subject = data?.claims?.sub;

    if (!error && typeof subject === "string" && subject) {
      userId = subject;
    }
  } catch {
    // Invalid, expired, and unavailable sessions all use the login route.
  }

  if (!supabase || !userId) {
    redirect("/login");
  }

  let profile: { username: string } | null = null;
  let profileLoadFailed = false;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      profileLoadFailed = true;
    } else {
      profile = data;
    }
  } catch {
    profileLoadFailed = true;
  }

  if (profileLoadFailed) {
    return (
      <AuthShell
        eyebrow="Player profile"
        title="Profile unavailable"
        description="Your account is signed in, but your profile could not be loaded."
      >
        <p className={styles.formError} role="alert">
          We could not load your profile right now. Please try again later.
        </p>
      </AuthShell>
    );
  }

  if (!profile) {
    return (
      <AuthShell
        eyebrow="Player profile"
        title="Create your profile"
        description="Choose the username that will identify you across JSG Games. You can change it later."
      >
        <ProfileForm key="create-profile" mode="create" />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Player profile"
      title="Your profile"
      description="View your current username or choose a new one."
    >
      <div className={styles.profileSummary}>
        <span className={styles.profileLabel}>Current username</span>
        <strong className={styles.profileValue}>{profile.username}</strong>
      </div>
      <ProfileForm
        key={`update-${profile.username}`}
        currentUsername={profile.username}
        mode="update"
      />
    </AuthShell>
  );
}
