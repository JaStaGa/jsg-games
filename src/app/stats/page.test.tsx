import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { path });
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import StatsPage from "./page";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const GAME_ID = 7;

type StatsFixture = {
  average_score: number | string | null;
  games_played: number | string;
  personal_best: number | null;
};

type RunFixture = {
  completed_at: string;
  id: number;
  score: number;
};

function setSignedInClient({
  game = { id: GAME_ID },
  gameError = null,
  profile = { id: USER_ID },
  profileError = null,
  runs = [],
  runsError = null,
  stats = null,
  statsError = null,
}: {
  game?: { id: number } | null;
  gameError?: unknown;
  profile?: { id: string } | null;
  profileError?: unknown;
  runs?: RunFixture[];
  runsError?: unknown;
  stats?: StatsFixture | null;
  statsError?: unknown;
} = {}) {
  const profileMaybeSingle = vi.fn().mockResolvedValue({
    data: profile,
    error: profileError,
  });
  const profileEq = vi.fn(() => ({ maybeSingle: profileMaybeSingle }));
  const profileSelect = vi.fn(() => ({ eq: profileEq }));

  const gameMaybeSingle = vi.fn().mockResolvedValue({
    data: game,
    error: gameError,
  });
  const gameEq = vi.fn(() => ({ maybeSingle: gameMaybeSingle }));
  const gameSelect = vi.fn(() => ({ eq: gameEq }));

  const statsMaybeSingle = vi.fn().mockResolvedValue({
    data: stats,
    error: statsError,
  });
  const statsGameEq = vi.fn(() => ({ maybeSingle: statsMaybeSingle }));
  const statsUserEq = vi.fn(() => ({ eq: statsGameEq }));
  const statsSelect = vi.fn(() => ({ eq: statsUserEq }));

  const historyLimit = vi.fn().mockResolvedValue({
    data: runs,
    error: runsError,
  });
  const historyOrderChain = {
    limit: historyLimit,
    order: vi.fn(),
  };
  historyOrderChain.order.mockReturnValue(historyOrderChain);
  const historyGameEq = vi.fn(() => historyOrderChain);
  const historyUserEq = vi.fn(() => ({ eq: historyGameEq }));
  const historySelect = vi.fn(() => ({ eq: historyUserEq }));

  const from = vi.fn((table: string) => {
    if (table === "profiles") return { select: profileSelect };
    if (table === "games") return { select: gameSelect };
    if (table === "player_game_stats") return { select: statsSelect };
    if (table === "game_runs") return { select: historySelect };

    throw new Error(`Unexpected table: ${table}`);
  });

  mocks.createClient.mockResolvedValue({
    auth: {
      getClaims: vi.fn().mockResolvedValue({
        data: { claims: { sub: USER_ID } },
        error: null,
      }),
    },
    from,
  });

  return {
    from,
    gameEq,
    historyGameEq,
    historyLimit,
    historyOrder: historyOrderChain.order,
    historySelect,
    historyUserEq,
    statsGameEq,
    statsSelect,
    statsUserEq,
  };
}

describe("stats page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects a signed-out visitor to the fixed login route", async () => {
    mocks.createClient.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
    });

    await expect(StatsPage()).rejects.toMatchObject({ path: "/login" });
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("renders the signed-in player's aggregate values with one-decimal average", async () => {
    setSignedInClient({
      stats: { average_score: 5, games_played: 3, personal_best: 9 },
      runs: [
        { completed_at: "2026-09-02T12:00:00Z", id: 3, score: 9 },
        { completed_at: "2026-09-01T12:00:00Z", id: 2, score: 5 },
        { completed_at: "2026-08-31T12:00:00Z", id: 1, score: 1 },
      ],
    });

    const markup = renderToStaticMarkup(await StatsPage());

    expect(markup).toContain("SWGA statistics");
    expect(markup).toMatch(/Games played<\/dt><dd[^>]*>3<\/dd>/);
    expect(markup).toMatch(/Personal best<\/dt><dd[^>]*>9<\/dd>/);
    expect(markup).toMatch(/Average score<\/dt><dd[^>]*>5\.0<\/dd>/);
  });

  it("formats a recorded zero average as 0.0", async () => {
    setSignedInClient({
      stats: { average_score: 0, games_played: 1, personal_best: 0 },
      runs: [{ completed_at: "2026-09-02T12:00:00Z", id: 1, score: 0 }],
    });

    const markup = renderToStaticMarkup(await StatsPage());

    expect(markup).toMatch(/Personal best<\/dt><dd[^>]*>0<\/dd>/);
    expect(markup).toMatch(/Average score<\/dt><dd[^>]*>0\.0<\/dd>/);
  });

  it("renders recent runs in database order with deterministic UTC times", async () => {
    const query = setSignedInClient({
      stats: { average_score: "6.5", games_played: "2", personal_best: 8 },
      runs: [
        { completed_at: "2026-09-02T20:15:00Z", id: 12, score: 8 },
        { completed_at: "2026-09-02T20:15:00Z", id: 11, score: 5 },
      ],
    });

    const markup = renderToStaticMarkup(await StatsPage());

    expect(markup).toContain("Recent ranked SWGA history");
    expect(markup.indexOf(">8</td>")).toBeLessThan(
      markup.indexOf(">5</td>"),
    );
    expect(markup).toContain('dateTime="2026-09-02T20:15:00.000Z"');
    expect(markup).toContain("Sep 02, 2026 at 20:15:00 UTC");
    expect(query.gameEq).toHaveBeenCalledWith("slug", "swga");
    expect(query.statsSelect).toHaveBeenCalledWith(
      "games_played, personal_best, average_score",
    );
    expect(query.statsUserEq).toHaveBeenCalledWith("user_id", USER_ID);
    expect(query.statsGameEq).toHaveBeenCalledWith("game_id", GAME_ID);
    expect(query.historySelect).toHaveBeenCalledWith(
      "id, score, completed_at",
    );
    expect(query.historyUserEq).toHaveBeenCalledWith("user_id", USER_ID);
    expect(query.historyGameEq).toHaveBeenCalledWith("game_id", GAME_ID);
    expect(query.historyOrder.mock.calls).toEqual([
      ["completed_at", { ascending: false }],
      ["id", { ascending: false }],
    ]);
    expect(query.historyLimit).toHaveBeenCalledWith(20);
  });

  it("shows dashes and a SWGA link when the player has no ranked runs", async () => {
    setSignedInClient();

    const markup = renderToStaticMarkup(await StatsPage());

    expect(markup).toMatch(/Games played<\/dt><dd[^>]*>0<\/dd>/);
    expect(markup).toMatch(/Personal best<\/dt><dd[^>]*>—<\/dd>/);
    expect(markup).toMatch(/Average score<\/dt><dd[^>]*>—<\/dd>/);
    expect(markup).toContain("No ranked SWGA runs yet.");
    expect(markup).toContain('href="/games/swga"');
  });

  it("shows profile setup without loading game or score data", async () => {
    const query = setSignedInClient({ profile: null });

    const markup = renderToStaticMarkup(await StatsPage());

    expect(markup).toContain("Set up your profile");
    expect(markup).toContain('href="/profile"');
    expect(query.from).toHaveBeenCalledTimes(1);
    expect(query.from).not.toHaveBeenCalledWith("player_game_stats");
    expect(query.from).not.toHaveBeenCalledWith("game_runs");
  });

  it("renders a generic unavailable state without raw database detail", async () => {
    setSignedInClient({
      statsError: { message: "sensitive database detail" },
    });

    const markup = renderToStaticMarkup(await StatsPage());

    expect(markup).toContain("Stats unavailable");
    expect(markup).toContain(
      "We could not load your statistics right now. Please try again later.",
    );
    expect(markup).not.toContain("sensitive database detail");
  });
});
