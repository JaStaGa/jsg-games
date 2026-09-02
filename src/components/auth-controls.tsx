"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./site-header.module.css";

type HeaderAuthState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; identity: string };

export function AuthControls() {
  const pathname = usePathname();
  const [authState, setAuthState] = useState<HeaderAuthState>({
    status: "loading",
  });

  useEffect(() => {
    let active = true;
    let authEventObserved = false;
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      authEventObserved = true;
      setAuthState(
        session
          ? {
              status: "signed-in",
              identity: session.user.email ?? "Signed in",
            }
          : { status: "signed-out" },
      );
    });

    void supabase.auth.getClaims().then(
      ({ data }) => {
        if (!active || authEventObserved) return;

        const claims = data?.claims;
        const email =
          claims && typeof claims.email === "string" ? claims.email : null;

        setAuthState(
          claims
            ? { status: "signed-in", identity: email ?? "Signed in" }
            : { status: "signed-out" },
        );
      },
      () => {
        if (active && !authEventObserved) {
          setAuthState({ status: "signed-out" });
        }
      },
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [pathname]);

  if (authState.status === "loading") {
    return (
      <span className={styles.authLoading} aria-live="polite">
        Checking session…
      </span>
    );
  }

  if (authState.status === "signed-out") {
    return <SignedOutAuthControls />;
  }

  return <SignedInAuthControls identity={authState.identity} />;
}

export function SignedOutAuthControls() {
  return (
    <nav className={styles.authControls} aria-label="Account">
      <Link className={styles.authLink} href="/login">
        Sign in
      </Link>
      <Link className={styles.authPrimaryLink} href="/signup">
        Create account
      </Link>
    </nav>
  );
}

export function SignedInAuthControls({ identity }: { identity: string }) {
  return (
    <div className={styles.authControls}>
      <span className={styles.identity} title={identity}>
        {identity}
      </span>
      <Link className={styles.authLink} href="/profile">
        Profile
      </Link>
      <Link className={styles.authLink} href="/stats">
        Stats
      </Link>
      <form action="/auth/signout" method="post">
        <button className={styles.authButton} type="submit">
          Sign out
        </button>
      </form>
    </div>
  );
}
