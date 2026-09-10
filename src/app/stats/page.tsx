import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Player statistics | JSG Games",
  description: "Review your ranked statistics and recent run history.",
};

export const dynamic = "force-dynamic";

// Competitive identities are distinct from the top-level site discovery registry.
const competitiveGames = [
  { slug: "swga", name: "SWGA", href: "/games/swga" },
  {
    slug: "character-guessing-expedition-crew",
    name: "Character Guessing — Expedition Crew",
    href: "/games/character-guessing/expedition-crew",
  },
  {
    slug: "character-guessing-copperlight-city",
    name: "Character Guessing — Copperlight City",
    href: "/games/character-guessing/copperlight-city",
  },
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numericValue(value: unknown): number {
  return typeof value === "number" ||
    (typeof value === "string" && value.trim() !== "")
    ? Number(value)
    : NaN;
}

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
      description="Your ranked record could not be loaded."
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

function parseStatRow(row: unknown) {
  if (row === null) return null;
  if (!isRecord(row)) return undefined;

  const gamesPlayed = numericValue(row.games_played);
  const personalBest = row.personal_best;
  const averageScore = numericValue(row.average_score);

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

function formatRun(row: unknown): DisplayRun | null {
  if (
    !isRecord(row) ||
    typeof row.id !== "number" ||
    !Number.isSafeInteger(row.id) ||
    row.id < 1 ||
    typeof row.score !== "number" ||
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
    id: row.id,
    score: row.score,
    completed_at: row.completed_at,
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
        description="A player profile is required before ranked runs can be recorded."
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

  const client = supabase;
  let records;
  try {
    const games = await Promise.all(competitiveGames.map(async (config) => {
      const result = await client.from("games").select("id")
        .eq("slug", config.slug).maybeSingle();
      if (result.error || !isRecord(result.data) ||
        typeof result.data.id !== "number" ||
        !Number.isSafeInteger(result.data.id) || result.data.id < 1) {
        throw new Error("Invalid competitive identity");
      }
      return { ...config, id: result.data.id };
    }));
    if (new Set(games.map((game) => game.id)).size !== games.length) {
      return unavailableState();
    }

    records = await Promise.all(games.map(async (game) => {
      const [statsResult, historyResult] = await Promise.all([
        client.from("player_game_stats")
          .select("games_played, personal_best, average_score")
          .eq("user_id", userId).eq("game_id", game.id).maybeSingle(),
        client.from("game_runs").select("id, score, completed_at")
          .eq("user_id", userId).eq("game_id", game.id)
          .order("completed_at", { ascending: false })
          .order("id", { ascending: false }).limit(20),
      ]);
      if (statsResult.error || historyResult.error ||
        !Array.isArray(historyResult.data)) {
        throw new Error("Unavailable ranked record");
      }
      const stats = parseStatRow(statsResult.data);
      const runs = historyResult.data.map(formatRun);
      if (stats === undefined || runs.some((run) => run === null) ||
        runs.length > 20 ||
        new Set(runs.map((run) => run?.id)).size !== runs.length ||
        (stats === null && runs.length > 0) ||
        (stats !== null && (stats.gamesPlayed < runs.length ||
          (runs.length < 20 && stats.gamesPlayed !== runs.length)))) {
        throw new Error("Invalid ranked record");
      }
      return { game, stats, displayRuns: runs.filter((run): run is DisplayRun => run !== null) };
    }));
  } catch {
    return unavailableState();
  }

  return (
    <StatsShell
      eyebrow="Player record"
      title="Ranked statistics"
      description="Your ranked performance, recorded separately for each competitive game."
    >
      {records.map(({ game, stats, displayRuns }) => (
        <section key={game.slug} className={styles.gameSection} aria-labelledby={`${game.slug}-title`}>
          <h2 id={`${game.slug}-title`}>{game.name}</h2>
          <dl className={styles.statGrid} aria-label={`Ranked ${game.name} statistics`}>
            <div className={styles.statCard}>
              <dt>Games played</dt>
              <dd>{stats?.gamesPlayed ?? 0}</dd>
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

          <section className={styles.history} aria-labelledby={`${game.slug}-history-title`}>
            <div className={styles.historyHeading}>
              <div>
                <p className={styles.sectionLabel}>Latest results</p>
                <h3 id={`${game.slug}-history-title`}>Recent ranked history</h3>
              </div>
              {(stats?.gamesPlayed ?? 0) > 20 ? (
                <span className={styles.historyCount}>Most recent 20</span>
              ) : null}
            </div>

            {displayRuns.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No ranked {game.name} runs yet.</p>
                <Link className={styles.primaryLink} href={game.href}>
                  Play {game.name}
                </Link>
              </div>
            ) : (
              <div className={styles.tableFrame}>
                <table className={styles.historyTable}>
                  <caption>Up to 20 most recent ranked {game.name} runs</caption>
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
        </section>
      ))}
    </StatsShell>
  );
}
