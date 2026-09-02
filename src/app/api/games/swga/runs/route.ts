import { validateRankedSwgaSubmission } from "@/games/swga/logic/ranked-submission";
import { createPrivilegedClient } from "@/lib/supabase/privileged";
import { createClient } from "@/lib/supabase/server";

const SWGA_SLUG = "swga";

type ApiError =
  | "authentication_required"
  | "invalid_submission"
  | "profile_required"
  | "service_unavailable"
  | "submission_conflict";

function errorResponse(error: ApiError, status: number) {
  return Response.json({ error, ok: false }, { status });
}

export async function POST(request: Request) {
  let supabase: Awaited<ReturnType<typeof createClient>>;

  try {
    supabase = await createClient();
  } catch {
    return errorResponse("service_unavailable", 503);
  }

  let userId: string;

  try {
    const { data, error } = await supabase.auth.getClaims();
    const subject = data?.claims?.sub;

    if (error || typeof subject !== "string" || !subject) {
      return errorResponse("authentication_required", 401);
    }

    userId = subject;
  } catch {
    return errorResponse("service_unavailable", 503);
  }

  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      return errorResponse("service_unavailable", 503);
    }

    if (!profile) {
      return errorResponse("profile_required", 403);
    }
  } catch {
    return errorResponse("service_unavailable", 503);
  }

  let rawPayload: unknown;

  try {
    rawPayload = await request.json();
  } catch {
    return errorResponse("invalid_submission", 400);
  }

  const validation = validateRankedSwgaSubmission(rawPayload);

  if (!validation.success) {
    return errorResponse("invalid_submission", 400);
  }

  let game: { id: number } | null;

  try {
    const { data, error } = await supabase
      .from("games")
      .select("id")
      .eq("slug", SWGA_SLUG)
      .maybeSingle();

    if (error || !data) {
      return errorResponse("service_unavailable", 503);
    }

    game = data;
  } catch {
    return errorResponse("service_unavailable", 503);
  }

  let privileged: ReturnType<typeof createPrivilegedClient>;

  try {
    privileged = createPrivilegedClient();
  } catch {
    return errorResponse("service_unavailable", 503);
  }

  const { submissionId, score } = validation.payload;

  try {
    const { error: insertError } = await privileged.from("game_runs").insert({
      user_id: userId,
      game_id: game.id,
      score,
      submission_id: submissionId,
    });

    if (!insertError) {
      return Response.json({ ok: true, status: "created" }, { status: 201 });
    }

    if (insertError.code !== "23505") {
      return errorResponse("service_unavailable", 503);
    }

    const { data: existingRun, error: lookupError } = await privileged
      .from("game_runs")
      .select("game_id, score")
      .eq("user_id", userId)
      .eq("submission_id", submissionId)
      .maybeSingle();

    if (lookupError || !existingRun) {
      return errorResponse("service_unavailable", 503);
    }

    if (existingRun.game_id === game.id && existingRun.score === score) {
      return Response.json(
        { ok: true, status: "already_recorded" },
        { status: 200 },
      );
    }

    return errorResponse("submission_conflict", 409);
  } catch {
    return errorResponse("service_unavailable", 503);
  }
}
