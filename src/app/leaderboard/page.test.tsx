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

    expect(markup).toContain("SWGA Leaderboard");
    expect(markup).toContain("60 Seconds Ranked");
    expect(rpc).toHaveBeenCalledTimes(1);
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
