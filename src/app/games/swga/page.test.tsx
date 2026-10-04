import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import SwgaPage from "./page";

function client({ user = "current-user", authError = false, gameId = 7, gameError = false, stats = { personal_best: 25 } as unknown, statsError = false } = {}) {
  const queries: { table: string; filters: [string, unknown][]; columns?: string }[] = [];
  const from = vi.fn((table: string) => {
    const query = { table, filters: [] as [string, unknown][], columns: "" };
    queries.push(query);
    const builder = {
      select: vi.fn((columns: string) => { query.columns = columns; return builder; }),
      eq: vi.fn((key: string, value: unknown) => { query.filters.push([key, value]); return builder; }),
      maybeSingle: vi.fn().mockResolvedValue(table === "games"
        ? { data: { id: gameId }, error: gameError }
        : { data: stats, error: statsError }),
    };
    return builder;
  });
  mocks.createClient.mockResolvedValue({ auth: { getClaims: vi.fn().mockResolvedValue({ data: user ? { claims: { sub: user } } : null, error: authError }) }, from });
  return { from, queries };
}
beforeEach(() => { vi.clearAllMocks(); client(); });

describe("SWGA page", () => {
  it("renders the playable game baseline", async () => {
    const markup = renderToStaticMarkup(await SwgaPage());

    expect(markup).toContain("<h1>SWGA</h1>");
    expect(markup).toContain('aria-label="Current game stats"');
    expect(markup).toContain("Round");
    expect(markup).toContain("Score");
    expect(markup).toContain("6 left");
    expect(markup).toContain('aria-label="Game mode"');
    expect(markup).toContain('aria-pressed="true">Untimed</button>');
    expect(markup).toContain(
      'aria-pressed="false">60 Seconds (Ranked)</button>',
    );
    expect(markup).not.toContain("Time remaining:");
    expect(markup).toContain('aria-label="On-screen keyboard"');
    expect(markup).toContain("Help");
    expect(markup).toContain("Restart");
  });
  it("reads only the authenticated player's SWGA aggregate", async () => {
    const { queries } = client();
    const page = await SwgaPage();
    expect(page.props.personalBest).toMatchObject({ userId: "current-user", result: { status: "known", score: 25 } });
    expect(queries).toEqual([
      { table: "games", columns: "id", filters: [["slug", "swga"]] },
      { table: "player_game_stats", columns: "personal_best", filters: [["user_id", "current-user"], ["game_id", 7]] },
    ]);
  });
  it.each([0, 100])("preserves a known best of %s", async (score) => {
    client({ stats: { personal_best: score } });
    expect((await SwgaPage()).props.personalBest.result).toEqual({ status: "known", score });
  });
  it("distinguishes no history from zero", async () => {
    client({ stats: null });
    expect((await SwgaPage()).props.personalBest.result).toEqual({ status: "no-history" });
  });
  it("keeps the signed-out route playable without statistics queries", async () => {
    const { from } = client({ user: "" });
    const page = await SwgaPage();
    expect(page.props.personalBest.result).toEqual({ status: "signed-out" });
    expect(from).not.toHaveBeenCalled();
    expect(renderToStaticMarkup(page)).toContain("On-screen keyboard");
  });
  it.each([
    { authError: true }, { gameError: true }, { gameId: 0 }, { statsError: true },
    ...[null, "0", -1, 101, 1.5, NaN].map(personal_best => ({ stats: { personal_best } })),
  ])("keeps gameplay available after unavailable or malformed reads: %j", async (options) => {
    client(options);
    const page = await SwgaPage();
    expect(page.props.personalBest.result).toEqual({ status: "unavailable" });
    expect(renderToStaticMarkup(page)).toContain("On-screen keyboard");
  });
  it("contains thrown failures and gives each fresh read a distinct revision", async () => {
    mocks.createClient.mockRejectedValue(new Error("private connection details"));
    const first = await SwgaPage();
    const second = await SwgaPage();
    expect(first.props.personalBest.result.status).toBe("unavailable");
    expect(first.props.personalBest.revision).not.toBe(second.props.personalBest.revision);
    expect(renderToStaticMarkup(first)).not.toContain("private connection details");
  });
});
