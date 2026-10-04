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

  it("renders ranks, usernames, scores, and New York timestamps in returned order", async () => {
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
    expect(markup).toContain("Sep 02, 2026 at 16:15:00 EDT");
    expect(markup).toContain('dateTime="2026-09-01T07:04:05.000Z"');
    expect(markup).toContain("Sep 01, 2026 at 03:04:05 EDT");
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

const averageBoards = [
  "get_swga_average_leaderboard",
  "get_character_guessing_expedition_crew_average_leaderboard",
  "get_character_guessing_copperlight_city_average_leaderboard",
];
const averageRow = { rank: 1, username: "ValidPlayer", average_score: 10.04, games_played: 25 };
const averagePage = () => LeaderboardPage({ searchParams: Promise.resolve({ metric: "average" }) });

describe("average-score rankings", () => {
  it.each([undefined, "best", "", "AVERAGE", "get_swga_average_leaderboard", "other", ["average"], ["best", "average"]].map(metric => ({ metric })))(
    "defaults safely to Best Score for $metric", async ({ metric }) => {
      const { rpc } = setPublicClient();
      const html = renderToStaticMarkup(await LeaderboardPage({ searchParams: Promise.resolve({ metric }) }));
      expect(rpc.mock.calls).toEqual(boards.map(board => [board.rpc]));
      const selected = html.match(/<a[^>]*>Best Score<\/a>/)?.[0];
      expect(selected).toContain('href="/leaderboard"');
      expect(selected).toContain('aria-current="page"');
      expect(html).not.toContain("No players have qualified yet");
    },
  );
  it("uses only the three fixed average RPCs for public requests", async () => {
    const { rpc } = setPublicClient();
    const html = renderToStaticMarkup(await averagePage());
    expect(rpc.mock.calls).toEqual(averageBoards.map(name => [name]));
    expect(html).toContain('aria-label="Leaderboard ranking"');
    const selected = html.match(/<a[^>]*>Average Score<\/a>/)?.[0];
    expect(selected).toContain('href="/leaderboard?metric=average"');
    expect(selected).toContain('aria-current="page"');
    expect(html).toContain("Average-score rankings require at least 5 saved ranked games in each game. Qualifying makes you eligible for the top 10 but does not guarantee a position.");
    expect(html).not.toContain("No ranked SWGA scores yet");
    for (const [index, game] of boards.entries()) {
      const block = html.split(`aria-labelledby="game-${index}-title">`)[1].split("</section>")[0];
      expect(block).toContain("No players have qualified yet. Complete 5 ranked games in this game to qualify.");
      expect(block).toContain(`href="${game.href}"`);
    }
  });
  it("preserves full-precision database order and rounds only the visible average", async () => {
    const rpc = vi.fn(async (name: string) => {
      const index = averageBoards.indexOf(name);
      return { data: [
        { rank: 1, username: `Zulu${index}`, average_score: "10.04", games_played: "25" },
        { rank: 2, username: `Alpha${index}`, average_score: 10.02, games_played: 50 },
        { rank: 3, username: `Zero${index}`, average_score: 0, games_played: 5 },
      ] };
    });
    mocks.createClient.mockResolvedValue({ rpc });
    const html = renderToStaticMarkup(await averagePage());
    for (const [index, game] of boards.entries()) {
      const block = html.split(`aria-labelledby="game-${index}-title">`)[1].split("</section>")[0];
      expect(block).toContain(`Top 10 average scores for ${game.name}`);
      expect(block).toContain("Average score</th>");
      expect(block).toContain("Games played</th>");
      expect(block).not.toContain("Achieved");
      expect(block).not.toContain("<time");
      expect(block).toMatch(new RegExp(`>1</td><td[^>]*>Zulu${index}</td><td[^>]*>10.0</td><td>25</td>`));
      expect(block).toMatch(new RegExp(`>2</td><td[^>]*>Alpha${index}</td><td[^>]*>10.0</td><td>50</td>`));
      expect(block).toContain(">0.0</td><td>5</td>");
      expect(block.indexOf(`Zulu${index}`)).toBeLessThan(block.indexOf(`Alpha${index}`));
    }
  });
  it.each(averageBoards)("accepts ten qualified rows from %s", async (name) => {
    setIndependentClient(name, Array.from({ length: 10 }, (_, i) => ({ ...averageRow, rank: i + 1, username: `Player${i}` })));
    const html = renderToStaticMarkup(await averagePage());
    expect(html.match(/>10.0<\/td>/g)).toHaveLength(10);
    expect(html).not.toContain("Leaderboard unavailable");
  });
  it.each(averageBoards)("rejects malformed or private data from %s", async (name) => {
    const invalid = [null, {}, [null], [[]],
      ...[0, -1, 2, 1.5, "01", null].map(rank => [{ ...averageRow, rank }]),
      ...[0, 4, -1, 5.5, Infinity, Number.MAX_SAFE_INTEGER + 1, "05", "5.0", null, true].map(games_played => [{ ...averageRow, games_played }]),
      ...[-1, Infinity, NaN, 2147483648, "NaN", "Infinity", "", " ", "0x10", "1e2", "-1", "01.0", null, true, {}].map(average_score => [{ ...averageRow, average_score }]),
      ...[null, "ab", "_player", "a b", "a".repeat(21)].map(username => [{ ...averageRow, username }]),
      [averageRow, { ...averageRow, rank: 2, username: "validplayer" }],
      Array.from({ length: 11 }, (_, i) => ({ ...averageRow, rank: i + 1, username: `Player${i}` })),
      ...["user_id", "game_id", "email", "submission_id", "achieved_at", "score"].map(field => [{ ...averageRow, [field]: "private-field" }]),
      [{ rank: 1, username: "ValidPlayer", average_score: 5 }],
    ];
    for (const data of invalid) {
      setIndependentClient(name, data);
      const html = renderToStaticMarkup(await averagePage());
      expect(html).toContain("Leaderboard unavailable");
      expect(html).not.toContain("ValidPlayer");
      expect(html).not.toContain("private-field");
    }
  });
  it("handles a missing migration safely and keeps Best Score navigation available", async () => {
    setPublicClient({ data: null, error: { message: "function does not exist: private detail" } });
    const html = renderToStaticMarkup(await averagePage());
    expect(html).toContain("Leaderboard unavailable");
    expect(html).toContain('href="/leaderboard">Best Score</a>');
    expect(html).toContain("Average-score rankings require at least 5");
    expect(html).not.toContain("private detail");
    const { rpc } = setPublicClient();
    expect(renderToStaticMarkup(await LeaderboardPage())).toContain("No ranked SWGA scores yet.");
    expect(rpc.mock.calls).toEqual(boards.map(board => [board.rpc]));
  });
});
const validRow = { rank: 1, username: "ValidPlayer", score: 42, achieved_at: "2026-09-02T20:15:00Z" };
function setIndependentClient(target: string, data: unknown, error: unknown = null) {
  const rpc = vi.fn(async (name: string) => name === target ? { data, error } : { data: [], error: null });
  mocks.createClient.mockResolvedValue({ rpc });
  return rpc;
}

describe("separate public leaderboards", () => {
  it.each([
    ["2026-01-02T20:15:00Z", "Jan 02, 2026 at 15:15:00 EST", "2026-01-02T20:15:00.000Z"],
    ["2026-01-01T02:15:00Z", "Dec 31, 2025 at 21:15:00 EST", "2026-01-01T02:15:00.000Z"],
  ])("uses New York time and canonical ISO in every board for %s", async (achieved_at, label, iso) => {
    setPublicClient({ data: [{ ...validRow, achieved_at }] });
    const html = renderToStaticMarkup(await LeaderboardPage());
    for (const [index] of boards.entries()) {
      const block = html.split(`aria-labelledby="game-${index}-title">`)[1].split("</section>")[0];
      expect(block).toContain(`<time dateTime="${iso}">${label}</time>`);
      expect(block).toMatch(/>1<\/td><td[^>]*>ValidPlayer<\/td><td[^>]*>42<\/td>/);
    }
  });

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
      expect(block).toContain("Sep 02, 2026 at 16:15:00 EDT");
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
