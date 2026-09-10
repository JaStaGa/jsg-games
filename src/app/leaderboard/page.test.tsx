import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import LeaderboardPage from "./page";

type LeaderboardFixture = {
  achieved_at: string;
  rank: number | string;
  score: number | string;
  username: string;
};

function setPublicClient({
  data = [],
  error = null,
}: {
  data?: unknown;
  error?: unknown;
} = {}) {
  const rpc = vi.fn().mockResolvedValue({ data, error });

  mocks.createClient.mockResolvedValue({ rpc });

  return { rpc };
}

describe("leaderboard page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders for a signed-out public request and invokes the fixed RPC without parameters", async () => {
    const { rpc } = setPublicClient();

    const markup = renderToStaticMarkup(await LeaderboardPage());

    expect(markup).toContain("Leaderboards");
    expect(markup).toContain("60 Seconds Ranked");
    expect(rpc.mock.calls).toEqual([
      ["get_swga_leaderboard"],
      ["get_character_guessing_expedition_crew_leaderboard"],
      ["get_character_guessing_copperlight_city_leaderboard"],
    ]);
    expect(rpc).toHaveBeenCalledWith("get_swga_leaderboard");
    expect(mocks.createClient).toHaveBeenCalledTimes(1);
  });

  it("renders ranks, usernames, scores, and UTC timestamps in returned order", async () => {
    const rows: LeaderboardFixture[] = [
      {
        achieved_at: "2026-09-02T20:15:00Z",
        rank: 1,
        score: 42,
        username: "AlphaPlayer",
      },
      {
        achieved_at: "2026-09-01T03:04:05-04:00",
        rank: "2",
        score: "39",
        username: "Beta_Player",
      },
    ];
    setPublicClient({ data: rows });

    const markup = renderToStaticMarkup(await LeaderboardPage());

    expect(markup).toContain("Rank");
    expect(markup).toContain("Player");
    expect(markup).toContain("Best score");
    expect(markup).toContain("Achieved");
    expect(markup.indexOf("AlphaPlayer")).toBeLessThan(
      markup.indexOf("Beta_Player"),
    );
    expect(markup).toMatch(/>1<\/td><td[^>]*>AlphaPlayer<\/td><td[^>]*>42<\/td>/);
    expect(markup).toMatch(/>2<\/td><td[^>]*>Beta_Player<\/td><td[^>]*>39<\/td>/);
    expect(markup).toContain('dateTime="2026-09-02T20:15:00.000Z"');
    expect(markup).toContain("Sep 02, 2026 at 20:15:00 UTC");
    expect(markup).toContain('dateTime="2026-09-01T07:04:05.000Z"');
    expect(markup).toContain("Sep 01, 2026 at 07:04:05 UTC");
  });

  it("renders the empty state with a link to SWGA", async () => {
    setPublicClient();

    const markup = renderToStaticMarkup(await LeaderboardPage());

    expect(markup).toContain("No ranked SWGA scores yet.");
    expect(markup).toContain('href="/games/swga"');
    expect(markup).toContain("Play SWGA");
  });

  it("renders a controlled unavailable state without raw RPC error detail", async () => {
    setPublicClient({
      data: null,
      error: { message: "sensitive Postgres policy detail" },
    });

    const markup = renderToStaticMarkup(await LeaderboardPage());

    expect(markup).toContain("Leaderboard unavailable");
    expect(markup).toContain(
      "We could not load the leaderboard right now. Please try again later.",
    );
    expect(markup).not.toContain("sensitive Postgres policy detail");
  });

  it("handles thrown client failures with the same controlled state", async () => {
    mocks.createClient.mockRejectedValue(new Error("raw connection detail"));

    const markup = renderToStaticMarkup(await LeaderboardPage());

    expect(markup).toContain("Leaderboard unavailable");
    expect(markup).not.toContain("raw connection detail");
  });

  it("rejects malformed rows and never renders unexpected internal fields", async () => {
    setPublicClient({
      data: [
        {
          achieved_at: "not-a-timestamp",
          rank: 1,
          score: 42,
          username: "AlphaPlayer",
          user_id: "77777777-7777-4777-8777-777777777777",
        },
      ],
    });

    const markup = renderToStaticMarkup(await LeaderboardPage());

    expect(markup).toContain("Leaderboard unavailable");
    expect(markup).not.toContain("AlphaPlayer");
    expect(markup).not.toContain("user_id");
    expect(markup).not.toContain("77777777-7777-4777-8777-777777777777");
  });

  it("displays only the approved public leaderboard fields", async () => {
    setPublicClient({
      data: [
        {
          achieved_at: "2026-09-02T20:15:00Z",
          rank: 1,
          score: 42,
          username: "AlphaPlayer",
        },
      ],
    });

    const markup = renderToStaticMarkup(await LeaderboardPage());

    expect(markup).toContain("AlphaPlayer");
    expect(markup).not.toContain("Email");
    expect(markup).not.toContain("User ID");
    expect(markup).not.toContain("Run ID");
    expect(markup).not.toContain("Submission ID");
  });
});

const boards = [
  { rpc: "get_swga_leaderboard", name: "SWGA", href: "/games/swga" },
  { rpc: "get_character_guessing_expedition_crew_leaderboard", name: "Character Guessing — Expedition Crew", href: "/games/character-guessing/expedition-crew" },
  { rpc: "get_character_guessing_copperlight_city_leaderboard", name: "Character Guessing — Copperlight City", href: "/games/character-guessing/copperlight-city" },
];
const validRow = { rank: 1, username: "ValidPlayer", score: 42, achieved_at: "2026-09-02T20:15:00Z" };
function setIndependentClient(target: string, data: unknown, error: unknown = null) {
  const rpc = vi.fn(async (name: string) => name === target ? { data, error } : { data: [], error: null });
  mocks.createClient.mockResolvedValue({ rpc });
  return rpc;
}

describe("separate public leaderboards", () => {
  it("keeps each game's values in its own accessible section", async () => {
    const rpc = vi.fn(async (name: string) => {
      const index = boards.findIndex((game) => game.rpc === name);
      return { data: [{ ...validRow, username: ["SwgaPlayer", "CrewPlayer", "CityPlayer"][index], score: [10, 25, 39][index] }] };
    });
    mocks.createClient.mockResolvedValue({ rpc });
    const html = renderToStaticMarkup(await LeaderboardPage());
    const names = ["SwgaPlayer", "CrewPlayer", "CityPlayer"];
    for (const [index, game] of boards.entries()) {
      const block = html.split(`aria-labelledby="game-${index}-title">`)[1].split("</section>")[0];
      expect(block).toContain(game.name);
      expect(block).toContain(names[index]);
      expect(block).toContain(`>${[10, 25, 39][index]}</td>`);
      for (const other of names.filter((name) => name !== names[index])) expect(block).not.toContain(other);
      expect(block).toContain(`<caption>Top 10 personal-best scores for ${game.name}</caption>`);
      expect(block).toContain('scope="col"');
      expect(block).toContain('tabindex="0"');
      expect(block).toContain('dateTime="2026-09-02T20:15:00.000Z"');
      expect(block).toContain("Sep 02, 2026 at 20:15:00 UTC");
    }
  });

  it.each(boards)("uses the direct play link for an empty $name", async (game) => {
    setIndependentClient(game.rpc, []);
    const html = renderToStaticMarkup(await LeaderboardPage());
    expect(html).toContain(`No ranked ${game.name} scores yet.`);
    expect(html).toContain(`href="${game.href}"`);
    expect(html).toContain(`Play ${game.name}`);
  });

  it.each(boards)("accepts exactly ten rows for $name", async (game) => {
    setIndependentClient(game.rpc, Array.from({ length: 10 }, (_, i) => ({ ...validRow, rank: i + 1, username: `Player${i}` })));
    const html = renderToStaticMarkup(await LeaderboardPage());
    expect(html.match(/<time /g)).toHaveLength(10);
    expect(html).not.toContain("Leaderboard unavailable");
  });

  it.each(boards)("rejects malformed results for $name", async (game) => {
    const invalid = [null, {}, [null], [[]],
      ...[0, -1, 2, 1.5, "01", Number.MAX_SAFE_INTEGER + 1].map((rank) => [{ ...validRow, rank }]),
      ...[-1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1, "-1", "", null].map((score) => [{ ...validRow, score }]),
      ...["ab", "_player", "a b", "a".repeat(21), null].map((username) => [{ ...validRow, username }]),
      ...[null, "not-a-date", ""].map((achieved_at) => [{ ...validRow, achieved_at }]),
      [validRow, { ...validRow, rank: 2, username: "validplayer" }],
      Array.from({ length: 11 }, (_, i) => ({ ...validRow, rank: i + 1, username: `Player${i}` })),
      ...["user_id", "game_id", "run_id", "submission_id", "email", "profile_id"].map((field) => [{ ...validRow, [field]: "internal-secret" }]),
    ];
    for (const data of invalid) {
      setIndependentClient(game.rpc, data);
      const html = renderToStaticMarkup(await LeaderboardPage());
      expect(html).toContain("Leaderboard unavailable");
      expect(html).not.toContain("ValidPlayer");
      expect(html).not.toContain("internal-secret");
    }
  });

  it.each(boards)("hides errors from $name", async (game) => {
    setIndependentClient(game.rpc, null, { message: "private Postgres details" });
    const html = renderToStaticMarkup(await LeaderboardPage());
    expect(html).toContain("Leaderboard unavailable");
    expect(html).not.toContain("private Postgres details");
  });
});
