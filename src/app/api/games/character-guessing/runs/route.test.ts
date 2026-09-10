import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createPrivilegedClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));
vi.mock("@/lib/supabase/privileged", () => ({
  createPrivilegedClient: mocks.createPrivilegedClient,
}));

import { POST } from "./route";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_USER_ID = "22222222-2222-2222-2222-222222222222";
const SUBMISSION_ID = "123e4567-e89b-12d3-a456-426614174000";
const API_URL = "http://localhost:3000/api/games/character-guessing/runs";

const VALID_SUBMISSION = {
  submissionId: SUBMISSION_ID,
  score: 45,
  outcome: "timed-out",
  themeId: "expedition-crew",
  roundsPlayed: 10,
  solved: 9,
};

function requestWithJson(payload: unknown) {
  return new Request(API_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function setUserClient({
  claims = { sub: USER_ID },
  claimsError = null,
  profile = { id: USER_ID },
  profileError = null,
  game = { id: 7 },
  gameError = null,
}: {
  claims?: { sub?: string } | null;
  claimsError?: unknown;
  profile?: { id: string } | null;
  profileError?: unknown;
  game?: { id: number } | null;
  gameError?: unknown;
} = {}) {
  const profileMaybeSingle = vi
    .fn()
    .mockResolvedValue({ data: profile, error: profileError });
  const profileEq = vi.fn(() => ({ maybeSingle: profileMaybeSingle }));
  const profileSelect = vi.fn(() => ({ eq: profileEq }));
  const gameMaybeSingle = vi
    .fn()
    .mockResolvedValue({ data: game, error: gameError });
  const gameEq = vi.fn(() => ({ maybeSingle: gameMaybeSingle }));
  const gameSelect = vi.fn(() => ({ eq: gameEq }));
  const from = vi.fn((table: string) => {
    if (table === "profiles") {
      return { select: profileSelect };
    }

    if (table === "games") {
      return { select: gameSelect };
    }

    throw new Error(`Unexpected user-scoped table: ${table}`);
  });

  const getClaims = vi.fn().mockResolvedValue({
    data: claims ? { claims } : null,
    error: claimsError,
  });
  mocks.createClient.mockResolvedValue({
    auth: { getClaims },
    from,
  });

  return { from, gameEq, gameMaybeSingle, profileMaybeSingle, getClaims };
}

function setPrivilegedClient({
  insertError = null,
  existingRun = null,
  lookupError = null,
}: {
  insertError?: { code?: string; message?: string } | null;
  existingRun?: { game_id: number; score: number } | null;
  lookupError?: unknown;
} = {}) {
  const insert = vi.fn().mockResolvedValue({ error: insertError });
  const maybeSingle = vi
    .fn()
    .mockResolvedValue({ data: existingRun, error: lookupError });
  const submissionEq = vi.fn(() => ({ maybeSingle }));
  const userEq = vi.fn(() => ({ eq: submissionEq }));
  const select = vi.fn(() => ({ eq: userEq }));
  const from = vi.fn(() => ({ insert, select }));

  mocks.createPrivilegedClient.mockReturnValue({ from });

  return { from, insert, select, submissionEq, userEq, maybeSingle };
}

describe("ranked Character Guessing run route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when the request is unauthenticated", async () => {
    const { from } = setUserClient({ claims: null });

    const response = await POST(requestWithJson(VALID_SUBMISSION));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "authentication_required",
      ok: false,
    });
    expect(from).not.toHaveBeenCalled();
    expect(mocks.createPrivilegedClient).not.toHaveBeenCalled();
  });

  it("returns 403 when the authenticated user has no profile", async () => {
    setUserClient({ profile: null });

    const response = await POST(requestWithJson(VALID_SUBMISSION));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "profile_required",
      ok: false,
    });
    expect(mocks.createPrivilegedClient).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON", async () => {
    setUserClient();
    const request = new Request(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "invalid_submission",
      ok: false,
    });
    expect(mocks.createPrivilegedClient).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid ranked payload", async () => {
    const { gameMaybeSingle } = setUserClient();

    const response = await POST(
      requestWithJson({ ...VALID_SUBMISSION, score: 46 }),
    );

    expect(response.status).toBe(400);
    expect(gameMaybeSingle).not.toHaveBeenCalled();
    expect(mocks.createPrivilegedClient).not.toHaveBeenCalled();
  });

  it("fails safely when the predefined Character Guessing game is missing", async () => {
    setUserClient({ game: null });

    const response = await POST(requestWithJson(VALID_SUBMISSION));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "service_unavailable",
      ok: false,
    });
    expect(mocks.createPrivilegedClient).not.toHaveBeenCalled();
  });

  it("inserts trusted values once and returns 201", async () => {
    const { gameEq } = setUserClient();
    const { insert, from } = setPrivilegedClient();

    const response = await POST(requestWithJson(VALID_SUBMISSION));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      status: "created",
    });
    expect(gameEq).toHaveBeenCalledWith("slug", "character-guessing-expedition-crew");
    expect(from).toHaveBeenCalledWith("game_runs");
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith({
      user_id: USER_ID,
      game_id: 7,
      score: 45,
      submission_id: SUBMISSION_ID,
    });
  });

  it("returns a successful idempotent response for an identical retry", async () => {
    setUserClient();
    const { insert, userEq, submissionEq } = setPrivilegedClient({
      insertError: { code: "23505" },
      existingRun: { game_id: 7, score: 45 },
    });

    const response = await POST(requestWithJson(VALID_SUBMISSION));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      status: "already_recorded",
    });
    expect(insert).toHaveBeenCalledTimes(1);
    expect(userEq).toHaveBeenCalledWith("user_id", USER_ID);
    expect(submissionEq).toHaveBeenCalledWith(
      "submission_id",
      SUBMISSION_ID,
    );
  });

  it("returns 409 when a submission ID is reused with another score", async () => {
    setUserClient();
    setPrivilegedClient({
      insertError: { code: "23505" },
      existingRun: { game_id: 7, score: 40 },
    });

    const response = await POST(requestWithJson(VALID_SUBMISSION));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "submission_conflict",
      ok: false,
    });
  });

  it("returns a generic 5xx response for an insert failure", async () => {
    setUserClient();
    setPrivilegedClient({
      insertError: { code: "XX000", message: "sensitive database detail" },
    });

    const response = await POST(requestWithJson(VALID_SUBMISSION));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({ error: "service_unavailable", ok: false });
    expect(JSON.stringify(body)).not.toContain("sensitive database detail");
  });

  it("rejects browser-supplied ownership, game, and timestamp fields", async () => {
    setUserClient();

    const response = await POST(
      requestWithJson({
        ...VALID_SUBMISSION,
        user_id: OTHER_USER_ID,
        userId: OTHER_USER_ID,
        game_id: 99,
        gameId: 99,
        gameSlug: "other-game",
        completed_at: "2026-09-02T00:00:00Z",
        completedAt: "2026-09-02T00:00:00Z",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.createPrivilegedClient).not.toHaveBeenCalled();
  });

  it("resolves Copperlight City and inserts only its server-selected identity", async () => {
    const { gameEq } = setUserClient({ game: { id: 8 } });
    const { insert } = setPrivilegedClient();
    const response = await POST(requestWithJson({ ...VALID_SUBMISSION, themeId: "copperlight-city" }));
    expect(response.status).toBe(201);
    expect(gameEq).toHaveBeenCalledExactlyOnceWith("slug", "character-guessing-copperlight-city");
    expect(insert).toHaveBeenCalledExactlyOnceWith({
      user_id: USER_ID, game_id: 8, score: 45, submission_id: SUBMISSION_ID,
    });
  });

  it("accepts an identical Copperlight City retry", async () => {
    setUserClient({ game: { id: 8 } });
    const { userEq, submissionEq } = setPrivilegedClient({
      insertError: { code: "23505" }, existingRun: { game_id: 8, score: 45 },
    });
    const response = await POST(requestWithJson({ ...VALID_SUBMISSION, themeId: "copperlight-city" }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, status: "already_recorded" });
    expect(userEq).toHaveBeenCalledWith("user_id", USER_ID);
    expect(submissionEq).toHaveBeenCalledWith("submission_id", SUBMISSION_ID);
  });

  it.each([
    { themeId: "expedition-crew", gameId: 7, existingGameId: 8 },
    { themeId: "copperlight-city", gameId: 8, existingGameId: 7 },
  ])("conflicts when a UUID from the other theme is submitted to $themeId", async ({ themeId, gameId, existingGameId }) => {
    setUserClient({ game: { id: gameId } });
    setPrivilegedClient({ insertError: { code: "23505" }, existingRun: { game_id: existingGameId, score: 45 } });
    const response = await POST(requestWithJson({ ...VALID_SUBMISSION, themeId }));
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "submission_conflict" });
  });

  it.each(["user_id", "userId", "game_id", "gameId", "gameSlug", "completed_at", "completedAt"])(
    "rejects extra %s before game lookup or privileged access", async (field) => {
      const { gameEq } = setUserClient();
      const response = await POST(requestWithJson({ ...VALID_SUBMISSION, [field]: "untrusted" }));
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ ok: false, error: "invalid_submission" });
      expect(gameEq).not.toHaveBeenCalled();
      expect(mocks.createPrivilegedClient).not.toHaveBeenCalled();
    },
  );

  it.each(["unknown", "character-guessing", "character-guessing-copperlight-city", "__proto__"])(
    "rejects non-allowlisted theme %s before privileged access", async (themeId) => {
      const { gameEq } = setUserClient();
      const response = await POST(requestWithJson({ ...VALID_SUBMISSION, themeId }));
      expect(response.status).toBe(400);
      expect(gameEq).not.toHaveBeenCalled();
      expect(mocks.createPrivilegedClient).not.toHaveBeenCalled();
    },
  );

  it.each([null, {}, { sub: "" }])("rejects missing auth subject %j", async (claims) => {
    const { from } = setUserClient({ claims });
    const response = await POST(requestWithJson(VALID_SUBMISSION));
    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
    expect(mocks.createPrivilegedClient).not.toHaveBeenCalled();
  });

  it("rejects claims accompanied by an auth error", async () => {
    const { from } = setUserClient({ claimsError: { message: "sensitive auth detail" } });
    const response = await POST(requestWithJson(VALID_SUBMISSION));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "authentication_required" });
    expect(from).not.toHaveBeenCalled();
  });

  it.each(["client", "claims", "profile-error", "profile-throw", "game-error", "game-throw"])(
    "returns safe errors without privileged access for %s failure", async (failure) => {
      const sensitive = new Error("sensitive infrastructure detail");
      const client = setUserClient();
      if (failure === "client") mocks.createClient.mockRejectedValue(sensitive);
      if (failure === "claims") client.getClaims.mockRejectedValue(sensitive);
      if (failure === "profile-error") client.profileMaybeSingle.mockResolvedValue({ data: null, error: sensitive });
      if (failure === "profile-throw") client.profileMaybeSingle.mockRejectedValue(sensitive);
      if (failure === "game-error") client.gameMaybeSingle.mockResolvedValue({ data: null, error: sensitive });
      if (failure === "game-throw") client.gameMaybeSingle.mockRejectedValue(sensitive);
      const response = await POST(requestWithJson(VALID_SUBMISSION));
      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toEqual({ ok: false, error: "service_unavailable" });
      expect(mocks.createPrivilegedClient).not.toHaveBeenCalled();
    },
  );

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])("fails safely for invalid resolved game ID %s", async (id) => {
    setUserClient({ game: { id } });
    const response = await POST(requestWithJson(VALID_SUBMISSION));
    expect(response.status).toBe(503);
    expect(mocks.createPrivilegedClient).not.toHaveBeenCalled();
  });

  it.each(["privileged-client", "insert-throw", "lookup-error", "lookup-throw", "lookup-missing"])(
    "returns generic safe errors for %s failure", async (failure) => {
      setUserClient();
      const sensitive = new Error("sensitive database detail");
      const client = setPrivilegedClient({ insertError: { code: "23505" } });
      if (failure === "privileged-client") mocks.createPrivilegedClient.mockImplementation(() => { throw sensitive; });
      if (failure === "insert-throw") client.insert.mockRejectedValue(sensitive);
      if (failure === "lookup-error") client.maybeSingle.mockResolvedValue({ data: { game_id: 7, score: 45 }, error: sensitive });
      if (failure === "lookup-throw") client.maybeSingle.mockRejectedValue(sensitive);
      const response = await POST(requestWithJson(VALID_SUBMISSION));
      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toEqual({ ok: false, error: "service_unavailable" });
    },
  );
});
