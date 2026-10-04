import "server-only";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import type { PersonalBestSnapshot } from "./personal-best";

export async function readSwgaPersonalBest(): Promise<PersonalBestSnapshot> {
  const snapshot: PersonalBestSnapshot = {
    revision: randomUUID(),
    userId: null,
    result: { status: "unavailable" },
  };
  try {
    const client = await createClient();
    const { data, error } = await client.auth.getClaims();
    if (error) return snapshot;
    const subject = data?.claims?.sub;
    if (subject === undefined || subject === null) {
      return { ...snapshot, result: { status: "signed-out" } };
    }
    if (typeof subject !== "string" || !subject) return snapshot;
    snapshot.userId = subject;

    const game = await client.from("games").select("id")
      .eq("slug", "swga").maybeSingle();
    if (game.error || !game.data || !Number.isSafeInteger(game.data.id) || game.data.id < 1) {
      return snapshot;
    }
    const stats = await client.from("player_game_stats").select("personal_best")
      .eq("user_id", subject).eq("game_id", game.data.id).maybeSingle();
    if (stats.error) return snapshot;
    if (stats.data === null) return { ...snapshot, result: { status: "no-history" } };
    const score = stats.data?.personal_best;
    if (typeof score !== "number" || !Number.isSafeInteger(score) || score < 0 || score > 100) {
      return snapshot;
    }
    return { ...snapshot, result: { status: "known", score } };
  } catch {
    return snapshot;
  }
}
