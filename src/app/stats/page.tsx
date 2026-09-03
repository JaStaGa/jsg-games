import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Player statistics | JSG Games",
  description: "Review your ranked SWGA statistics and recent run history.",
};

export const dynamic = "force-dynamic";

type StatRow = {
  games_played: number | string;
  personal_best: number | null;
  average_score: number | string | null;
};

type RunRow = {
  id: number;
  score: number;
  completed_at: string;
};

type DisplayRun = RunRow & {
  dateTime: string;
  completedAtLabel: string;
};

function unavailableState() {
  return (
    <StatsShell
      eyebrow="Player record"
      title="Stats unavailable"
      description="Your ranked SWGA record could not be loaded."
    >
      <p className={styles.notice} role="alert">
        We could not load your statistics right now. Please try again later.
      </p>
    </StatsShell>
  );
}

function StatsShell({
  children,
  description,
  eyebrow,
  title,
}: {
  children: React.ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="stats-title">
        <header className={styles.hero}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 id="stats-title">{title}</h1>
          <p className={styles.intro}>{description}</p>
        </header>
        {children}
      </section>
    </main>
  );
}

function parseStatRow(row: StatRow | null) {
  if (!row) return null;

  const gamesPlayed = Number(row.games_played);
  const personalBest = row.personal_best;
  const averageScore = Number(row.average_score);

  if (
    !Number.isSafeInteger(gamesPlayed) ||
    gamesPlayed < 1 ||
    typeof personalBest !== "number" ||
    !Number.isSafeInteger(personalBest) ||
    personalBest < 0 ||
    !Number.isFinite(averageScore) ||
    averageScore < 0
  ) {
    return undefined;
  }

  return { averageScore, gamesPlayed, personalBest };
}

function formatRun(row: RunRow): DisplayRun | null {
  if (
    !Number.isSafeInteger(row.id) ||
    !Number.isSafeInteger(row.score) ||
    row.score < 0 ||
    typeof row.completed_at !== "string"
  ) {
    return null;
  }

  const completedAt = new Date(row.completed_at);

  if (Number.isNaN(completedAt.getTime())) return null;

  const month = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ][completedAt.getUTCMonth()];
  const pad = (value: number) => value.toString().padStart(2, "0");

  return {
    ...row,
    dateTime: completedAt.toISOString(),
    completedAtLabel: `${month} ${pad(completedAt.getUTCDate())}, ${completedAt.getUTCFullYear()} at ${pad(completedAt.getUTCHours())}:${pad(completedAt.getUTCMinutes())}:${pad(completedAt.getUTCSeconds())} UTC`,
  };
}

export default async function StatsPage() {
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

  let profile: { id: string } | null = null;

  try {
    const result = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (result.error) return unavailableState();
    profile = result.data;
  } catch {
    return unavailableState();
  }

  if (!profile) {
    return (
      <StatsShell
        eyebrow="Player record"
        title="Set up your profile"
        description="A player profile is required before ranked SWGA runs can be recorded."
      >
        <p className={styles.notice}>
          Complete your player setup to start building a ranked record.
        </p>
        <Link className={styles.primaryLink} href="/profile">
          Set up profile
        </Link>
      </StatsShell>
    );
  }

  let game: { id: number } | null = null;

  try {
    const result = await supabase
      .from("games")
      .select("id")
      .eq("slug", "swga")
      .maybeSingle();

    if (
      result.error ||
      !result.data ||
      !Number.isSafeInteger(result.data.id)
    ) {
      return unavailableState();
    }
    game = result.data;
  } catch {
    return unavailableState();
  }

  let statRow: StatRow | null = null;
  let runRows: RunRow[] = [];

  try {
    const [statsResult, historyResult] = await Promise.all([
      supabase
        .from("player_game_stats")
        .select("games_played, personal_best, average_score")
        .eq("user_id", userId)
        .eq("game_id", game.id)
        .maybeSingle(),
      supabase
        .from("game_runs")
        .select("id, score, completed_at")
        .eq("user_id", userId)
        .eq("game_id", game.id)
        .order("completed_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(20),
    ]);

    if (
      statsResult.error ||
      historyResult.error ||
      (historyResult.data !== null && !Array.isArray(historyResult.data))
    ) {
      return unavailableState();
    }
    statRow = statsResult.data;
    runRows = historyResult.data ?? [];
  } catch {
    return unavailableState();
  }

  const stats = parseStatRow(statRow);
  const runs = runRows.map(formatRun);

  if (
    stats === undefined ||
    runs.some((run) => run === null) ||
    (stats === null && runs.length > 0) ||
    (stats !== null && stats.gamesPlayed !== runs.length && runs.length < 20)
  ) {
    return unavailableState();
  }

  const displayRuns = runs.filter((run): run is DisplayRun => run !== null);
  const gamesPlayed = stats?.gamesPlayed ?? 0;

  return (
    <StatsShell
      eyebrow="Player record"
      title="SWGA statistics"
      description="Your ranked performance, calculated from completed SWGA runs."
    >
      <dl className={styles.statGrid} aria-label="Ranked SWGA statistics">
        <div className={styles.statCard}>
          <dt>Games played</dt>
          <dd>{gamesPlayed}</dd>
        </div>
        <div className={styles.statCard}>
          <dt>Personal best</dt>
          <dd>{stats?.personalBest ?? "—"}</dd>
        </div>
        <div className={styles.statCard}>
          <dt>Average score</dt>
          <dd>{stats ? stats.averageScore.toFixed(1) : "—"}</dd>
        </div>
      </dl>

      <section className={styles.history} aria-labelledby="history-title">
        <div className={styles.historyHeading}>
          <div>
            <p className={styles.sectionLabel}>Latest results</p>
            <h2 id="history-title">Recent ranked SWGA history</h2>
          </div>
          {gamesPlayed > 20 ? (
            <span className={styles.historyCount}>Most recent 20</span>
          ) : null}
        </div>

        {displayRuns.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No ranked SWGA runs yet.</p>
            <Link className={styles.primaryLink} href="/games/swga">
              Play SWGA
            </Link>
          </div>
        ) : (
          <div className={styles.tableFrame}>
            <table className={styles.historyTable}>
              <caption>Up to 20 most recent ranked SWGA runs</caption>
              <thead>
                <tr>
                  <th scope="col">Score</th>
                  <th scope="col">Completed</th>
                </tr>
              </thead>
              <tbody>
                {displayRuns.map((run) => (
                  <tr key={run.id}>
                    <td className={styles.score}>{run.score}</td>
                    <td>
                      <time dateTime={run.dateTime}>
                        {run.completedAtLabel}
                      </time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </StatsShell>
  );
}
