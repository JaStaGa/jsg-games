import { type NextRequest, NextResponse } from "next/server";
import {
  hasRecoveryAuthenticationMethod,
  RECOVERY_ERROR_PATH,
} from "@/lib/auth/recovery";
import { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

function redirectTo(request: NextRequest, path: string) {
  const destination = request.nextUrl.clone();
  const [pathname, search = ""] = path.split("?", 2);

  destination.pathname = pathname;
  destination.search = search;
  destination.hash = "";

  return NextResponse.redirect(destination, { status: 303 });
}

async function clearLocalSession(supabase: ServerSupabaseClient) {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // A callback failure must not expose or preserve a newly exchanged session.
  }
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const flowId = request.nextUrl.searchParams.get("sb_flow_id");

  if (!code) {
    return redirectTo(request, RECOVERY_ERROR_PATH);
  }

  let supabase: ServerSupabaseClient | null = null;
  let recoverySessionEstablished = false;

  try {
    supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined,
    );

    if (error) {
      return redirectTo(request, RECOVERY_ERROR_PATH);
    }

    recoverySessionEstablished = true;

    const { data, error: claimsError } = await supabase.auth.getClaims();

    if (
      claimsError ||
      !hasRecoveryAuthenticationMethod(data?.claims)
    ) {
      await clearLocalSession(supabase);
      return redirectTo(request, RECOVERY_ERROR_PATH);
    }
  } catch {
    if (recoverySessionEstablished && supabase) {
      await clearLocalSession(supabase);
    }

    return redirectTo(request, RECOVERY_ERROR_PATH);
  }

  return redirectTo(request, "/update-password");
}
