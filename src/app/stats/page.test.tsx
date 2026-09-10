import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { path });
  }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
import StatsPage from "./page";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const games = [
  { id: 7, slug: "swga", name: "SWGA", href: "/games/swga" },
  { id: 12, slug: "character-guessing-expedition-crew", name: "Character Guessing — Expedition Crew", href: "/games/character-guessing/expedition-crew" },
  { id: 19, slug: "character-guessing-copperlight-city", name: "Character Guessing — Copperlight City", href: "/games/character-guessing/copperlight-city" },
];
const run = (id = 1, score = 0) => ({ id, score, completed_at: "2026-09-02T20:15:00Z" });
const aggregate = (count = 1, best = 0, average: unknown = 0) => ({ games_played: count, personal_best: best, average_score: average });
type Result = { data: unknown; error?: unknown };
type Query = { table: string; select?: string; filters: unknown[][]; orders: unknown[][]; limit?: number; single?: boolean };
function client(overrides: Record<string, Result> = {}) {
  const queries: Query[] = [];
  const from = vi.fn((table: string) => {
    const query: Query = { table, filters: [], orders: [] };
    queries.push(query);
    const result = () => {
      const key = table === "games" ? query.filters[0]?.[1] : query.filters[1]?.[1];
      const override = overrides[`${table}:${key}`] ?? overrides[table];
      if (override) return Promise.resolve(override);
      if (table === "profiles") return Promise.resolve({ data: { id: USER_ID } });
      if (table === "games") return Promise.resolve({ data: games.find((game) => game.slug === key) });
      if (table === "player_game_stats") return Promise.resolve({ data: null });
      if (table === "game_runs") return Promise.resolve({ data: [] });
      throw new Error("Unexpected table");
    };
    const chain = {
      select: (value: string) => { query.select = value; return chain; },
      eq: (...args: unknown[]) => { query.filters.push(args); return chain; },
      order: (...args: unknown[]) => { query.orders.push(args); return chain; },
      limit: (value: number) => { query.limit = value; return result(); },
      maybeSingle: () => { query.single = true; return result(); },
    };
    return chain;
  });
  const getClaims = vi.fn().mockResolvedValue({ data: { claims: { sub: USER_ID } } });
  mocks.createClient.mockResolvedValue({ auth: { getClaims }, from });
  return { queries, from, getClaims };
}
const markup = async () => renderToStaticMarkup(await StatsPage());
function section(html: string, slug: string) {
  return html.split(`aria-labelledby="${slug}-title">`)[1]?.split("</section></section>")[0];
}
async function expectUnavailable() {
  const html = await markup();
  expect(html).toContain("Stats unavailable");
  expect(html).toContain('role="alert"');
  expect(html).not.toContain("sensitive database detail");
  expect(html).not.toContain("Games played");
}

describe("stats page", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([null, { claims: {} }, { claims: { sub: "" } }, { claims: { sub: 7 } }])("redirects missing/invalid sessions to login: %j", async (data) => {
    const query = client();
    query.getClaims.mockResolvedValue({ data });
    await expect(StatsPage()).rejects.toMatchObject({ path: "/login" });
    expect(query.from).not.toHaveBeenCalled();
  });
  it("redirects an auth error even when claims are present", async () => {
    const query = client();
    query.getClaims.mockResolvedValue({ data: { claims: { sub: USER_ID } }, error: new Error("invalid") });
    await expect(StatsPage()).rejects.toMatchObject({ path: "/login" });
  });
  it("redirects when the session client throws", async () => {
    mocks.createClient.mockRejectedValue(new Error("unavailable"));
    await expect(StatsPage()).rejects.toMatchObject({ path: "/login" });
  });
  it("requires a profile before loading competitive data", async () => {
    const query = client({ profiles: { data: null } });
    const html = await markup();
    expect(html).toContain("Set up your profile");
    expect(html).toContain('href="/profile"');
    expect(query.queries).toEqual([{ table: "profiles", select: "id", filters: [["id", USER_ID]], orders: [], single: true }]);
  });
  it("resolves only the three configured slugs and scopes every read to the authenticated user and its game", async () => {
    const { queries } = client();
    await markup();
    expect(queries.filter((q) => q.table === "games")).toEqual(games.map((game) => ({ table: "games", select: "id", filters: [["slug", game.slug]], orders: [], single: true })));
    for (const game of games) {
      expect(queries).toContainEqual({ table: "player_game_stats", select: "games_played, personal_best, average_score", filters: [["user_id", USER_ID], ["game_id", game.id]], orders: [], single: true });
      expect(queries).toContainEqual({ table: "game_runs", select: "id, score, completed_at", filters: [["user_id", USER_ID], ["game_id", game.id]], orders: [["completed_at", { ascending: false }], ["id", { ascending: false }]], limit: 20 });
    }
    expect(queries).toHaveLength(10);
  });
  it("renders independent aggregates and ordered histories for all games", async () => {
    client({
      "player_game_stats:7": { data: aggregate(3, 9, 5) },
      "game_runs:7": { data: [run(3, 9), run(2, 5), run(1, 1)] },
      "player_game_stats:12": { data: { games_played: "2", personal_best: 18, average_score: "16.5" } },
      "game_runs:12": { data: [run(12, 18), run(11, 15)] },
      "player_game_stats:19": { data: aggregate(1, 0, 0) },
      "game_runs:19": { data: [run(19, 0)] },
    });
    const html = await markup();
    expect(html).toContain("Ranked statistics");
    for (const [index, values] of [[3, 9, "5.0"], [2, 18, "16.5"], [1, 0, "0.0"]].entries()) {
      const block = section(html, games[index].slug);
      expect(block).toContain(games[index].name);
      ["Games played", "Personal best", "Average score"].forEach((label, i) => expect(block).toContain(`${label}</dt><dd>${values[i]}</dd>`));
      expect(block).toContain("Sep 02, 2026 at 20:15:00 UTC");
      expect(block).toContain('dateTime="2026-09-02T20:15:00.000Z"');
    }
    const swga = section(html, "swga");
    expect(swga.indexOf(">9</td>")).toBeLessThan(swga.indexOf(">5</td>"));
    expect(swga).not.toContain(">18</td>");
    expect(section(html, games[1].slug)).not.toContain(">9</td>");
    expect(section(html, games[2].slug)).not.toContain(">18</td>");
  });
  it("renders zero/dashes and the exact direct play link for each empty identity", async () => {
    client();
    const html = await markup();
    for (const game of games) {
      const block = section(html, game.slug);
      expect(block).toContain("Games played</dt><dd>0</dd>");
      expect(block).toContain("Personal best</dt><dd>—</dd>");
      expect(block).toContain("Average score</dt><dd>—</dd>");
      expect(block).toContain(`No ranked ${game.name} runs yet.`);
      expect(block).toContain(`href="${game.href}"`);
      expect(block).not.toContain("Most recent 20");
    }
  });
  it.each(games)("limits $slug to 20 history rows and labels totals over 20", async (game) => {
    client({ [`player_game_stats:${game.id}`]: { data: aggregate(21) }, [`game_runs:${game.id}`]: { data: Array.from({ length: 20 }, (_, i) => run(20 - i)) } });
    const block = section(await markup(), game.slug);
    expect(block.match(/<time /g)).toHaveLength(20);
    expect(block).toContain("Most recent 20");
  });
  it.each(["profiles", "games", "player_game_stats", "game_runs"])("hides %s query error details", async (table) => {
    client({ [table]: { data: null, error: { message: "sensitive database detail" } } });
    await expectUnavailable();
  });
  it.each(games)("fails the whole page if $slug is missing or duplicated", async (game) => {
    for (const data of [null, [{ id: game.id }, { id: game.id }], { id: 0 }, { id: "7" }, { id: 1.5 }, { id: Number.MAX_SAFE_INTEGER + 1 }]) {
      client({ [`games:${game.slug}`]: { data } });
      await expectUnavailable();
    }
  });
  it("rejects two configured slugs resolving to the same identity", async () => {
    client({ [`games:${games[1].slug}`]: { data: { id: 7 } } });
    await expectUnavailable();
  });
  it.each(games)("rejects malformed aggregates for $slug without partial results", async (game) => {
    const invalid = [undefined, [], {}, false,
      ...[0, -1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1, null, "", true].map((games_played) => ({ ...aggregate(), games_played })),
      ...[-1, 1.5, Infinity, null, "0"].map((personal_best) => ({ ...aggregate(), personal_best })),
      ...[-1, Infinity, NaN, null, "", " ", true, "invalid"].map((average_score) => ({ ...aggregate(), average_score })),
    ];
    for (const data of invalid) {
      client({ [`player_game_stats:${game.id}`]: { data }, [`game_runs:${game.id}`]: { data: [run()] } });
      await expectUnavailable();
    }
  });
  it.each(games)("rejects malformed histories and inconsistent counts for $slug", async (game) => {
    const invalid = [null, {}, [null], [{}], [run(0)], [run(-1)], [run(1.5)], [run(1, -1)], [run(1, 0.5)], [run(1, Infinity)], [{ ...run(), completed_at: "invalid" }], [{ ...run(), completed_at: null }], [run(), run()], [], Array.from({ length: 21 }, (_, i) => run(i + 1))];
    for (const data of invalid) {
      client({ [`player_game_stats:${game.id}`]: { data: aggregate() }, [`game_runs:${game.id}`]: { data } });
      await expectUnavailable();
    }
    client({ [`game_runs:${game.id}`]: { data: [run()] } });
    await expectUnavailable();
    client({ [`player_game_stats:${game.id}`]: { data: aggregate(3) }, [`game_runs:${game.id}`]: { data: [run()] } });
    await expectUnavailable();
  });
  it("handles thrown data queries without exposing details", async () => {
    const query = client();
    query.from.mockImplementation(() => { throw new Error("sensitive database detail"); });
    await expectUnavailable();
  });
});
