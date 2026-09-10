import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Leaderboards | JSG Games",
  description: "View separate public top-10 leaderboards for SWGA and both Character Guessing themes.",
};

export const dynamic = "force-dynamic";

// Fixed server-side RPCs; browser input never selects a database scope.
const leaderboards = [
  { name: "SWGA", href: "/games/swga", rpc: "get_swga_leaderboard" },
  {
    name: "Character Guessing — Expedition Crew",
    href: "/games/character-guessing/expedition-crew",
    rpc: "get_character_guessing_expedition_crew_leaderboard",
  },
  {
    name: "Character Guessing — Copperlight City",
    href: "/games/character-guessing/copperlight-city",
    rpc: "get_character_guessing_copperlight_city_leaderboard",
  },
] as const;

const PUBLIC_ROW_KEYS = ["achieved_at", "rank", "score", "username"];

type LeaderboardRow = {
  achievedAtLabel: string;
  dateTime: string;
  rank: number;
  score: number;
  username: string;
};

function LeaderboardShell({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="leaderboard-title">
        <header className={styles.hero}>
          <p className={styles.eyebrow}>60 Seconds Ranked</p>
          <h1 id="leaderboard-title">Leaderboards</h1>
          <p className={styles.intro}>
            The top 10 personal-best scores for each competitive game.
          </p>
        </header>
        {children}
      </section>
    </main>
  );
}

function unavailableState() {
  return (
    <LeaderboardShell>
      <div className={styles.notice} role="alert">
        <h2>Leaderboard unavailable</h2>
        <p>
          We could not load the leaderboard right now. Please try again later.
        </p>
      </div>
    </LeaderboardShell>
  );
}

function parseInteger(value: unknown) {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) ? value : null;
  }

  if (typeof value !== "string" || !/^(0|[1-9]\d*)$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function formatAchievedAt(value: unknown) {
  if (typeof value !== "string") return null;

  const achievedAt = new Date(value);

  if (Number.isNaN(achievedAt.getTime())) return null;

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
  ][achievedAt.getUTCMonth()];
  const pad = (part: number) => part.toString().padStart(2, "0");

  return {
    achievedAtLabel: `${month} ${pad(achievedAt.getUTCDate())}, ${achievedAt.getUTCFullYear()} at ${pad(achievedAt.getUTCHours())}:${pad(achievedAt.getUTCMinutes())}:${pad(achievedAt.getUTCSeconds())} UTC`,
    dateTime: achievedAt.toISOString(),
  };
}

function parseLeaderboard(data: unknown): LeaderboardRow[] | null {
  if (!Array.isArray(data) || data.length > 10) return null;

  const rows: LeaderboardRow[] = [];
  const usernames = new Set<string>();

  for (const [index, value] of data.entries()) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }

    const raw = value as Record<string, unknown>;
    const keys = Object.keys(raw).sort();

    if (
      keys.length !== PUBLIC_ROW_KEYS.length ||
      keys.some((key, keyIndex) => key !== PUBLIC_ROW_KEYS[keyIndex])
    ) {
      return null;
    }

    const rank = parseInteger(raw.rank);
    const score = parseInteger(raw.score);
    const achievedAt = formatAchievedAt(raw.achieved_at);

    if (
      rank !== index + 1 ||
      score === null ||
      score < 0 ||
      typeof raw.username !== "string" ||
      !/^[A-Za-z0-9][A-Za-z0-9_]{2,19}$/.test(raw.username) ||
      !achievedAt
    ) {
      return null;
    }

    const normalizedUsername = raw.username.toLowerCase();

    if (usernames.has(normalizedUsername)) return null;
    usernames.add(normalizedUsername);

    rows.push({
      ...achievedAt,
      rank,
      score,
      username: raw.username,
    });
  }

  return rows;
}

export default async function LeaderboardPage() {
  let records;
  try {
    const supabase = await createClient();
    records = await Promise.all(leaderboards.map(async (game) => {
      const result = await supabase.rpc(game.rpc);
      if (result.error) throw new Error("Leaderboard unavailable");
      const rows = parseLeaderboard(result.data);
      if (!rows) throw new Error("Invalid leaderboard");
      return { game, rows };
    }));
  } catch {
    return unavailableState();
  }

  return (
    <LeaderboardShell>
      {records.map(({ game, rows }, index) => (
        <section key={game.rpc} className={styles.gameSection} aria-labelledby={`game-${index}-title`}>
          <h2 id={`game-${index}-title`}>{game.name}</h2>
          {rows.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No ranked {game.name} scores yet.</p>
              <Link className={styles.primaryLink} href={game.href}>
                Play {game.name}
              </Link>
            </div>
          ) : (
            <div className={styles.tableFrame} tabIndex={0} role="region" aria-label={`${game.name} leaderboard table`}>
              <table className={styles.leaderboardTable}>
                <caption>Top 10 personal-best scores for {game.name}</caption>
                <thead>
                  <tr>
                    <th scope="col">Rank</th>
                    <th scope="col">Player</th>
                    <th scope="col">Best score</th>
                    <th scope="col">Achieved</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.rank}>
                      <td className={styles.rank}>{row.rank}</td>
                      <td className={styles.player}>{row.username}</td>
                      <td className={styles.score}>{row.score}</td>
                      <td>
                        <time dateTime={row.dateTime}>{row.achievedAtLabel}</time>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </LeaderboardShell>
  );
}
