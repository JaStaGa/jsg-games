import { type NextRequest, NextResponse } from "next/server";
import { isSignupConfirmationType } from "@/lib/auth/confirmation";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  if (!tokenHash || !isSignupConfirmationType(type)) {
    return NextResponse.redirect(new URL("/auth/error", request.url));
  }

  let confirmed = false;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    confirmed = !error;
  } catch {
    // Missing, expired, invalid, and temporarily unverifiable links share the
    // same safe error destination without exposing provider details.
  }

  return NextResponse.redirect(
    new URL(confirmed ? "/auth/confirmed" : "/auth/error", request.url),
  );
}
