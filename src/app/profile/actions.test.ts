import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { createProfile, updateProfile } from "./actions";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_USER_ID = "22222222-2222-2222-2222-222222222222";

function profileForm(username: string, suppliedUserId?: string) {
  const formData = new FormData();
  formData.set("username", username);

  if (suppliedUserId) {
    formData.set("id", suppliedUserId);
  }

  return formData;
}

function authenticatedClient(from: ReturnType<typeof vi.fn>) {
  mocks.createClient.mockResolvedValue({
    auth: {
      getClaims: vi.fn().mockResolvedValue({
        data: { claims: { sub: USER_ID } },
        error: null,
      }),
    },
    from,
  });
}

describe("profile actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a profile with the verified user ID and trimmed username", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ insert }));
    authenticatedClient(from);

    await expect(
      createProfile({}, profileForm("  PlayerOne  ", OTHER_USER_ID)),
    ).resolves.toEqual({ message: "Profile created.", status: "success" });
    expect(from).toHaveBeenCalledWith("profiles");
    expect(insert).toHaveBeenCalledWith({
      id: USER_ID,
      username: "PlayerOne",
    });
    expect(insert).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: OTHER_USER_ID }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/profile");
  });

  it("updates only the verified user's username", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));
    authenticatedClient(from);

    await expect(
      updateProfile({}, profileForm("Renamed_Player", OTHER_USER_ID)),
    ).resolves.toEqual({ message: "Username updated.", status: "success" });
    expect(update).toHaveBeenCalledWith({ username: "Renamed_Player" });
    expect(eq).toHaveBeenCalledWith("id", USER_ID);
    expect(eq).not.toHaveBeenCalledWith("id", OTHER_USER_ID);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/profile");
  });

  it("returns the controlled duplicate response for PostgreSQL 23505", async () => {
    const insert = vi.fn().mockResolvedValue({
      error: { code: "23505", message: "sensitive database detail" },
    });
    authenticatedClient(vi.fn(() => ({ insert })));

    const result = await createProfile({}, profileForm("PlayerOne"));

    expect(result).toEqual({
      message: "That username is unavailable.",
      status: "error",
    });
    expect(JSON.stringify(result)).not.toContain("sensitive database detail");
  });

  it("keeps unexpected database failures generic", async () => {
    const eq = vi.fn().mockResolvedValue({
      error: { code: "XX000", message: "sensitive database detail" },
    });
    authenticatedClient(
      vi.fn(() => ({ update: vi.fn(() => ({ eq })) })),
    );

    const result = await updateProfile({}, profileForm("PlayerTwo"));

    expect(result).toEqual({
      message:
        "We could not save your profile right now. Please try again later.",
      status: "error",
    });
    expect(JSON.stringify(result)).not.toContain("sensitive database detail");
  });

  it("does not mutate when the verified session is unavailable", async () => {
    const from = vi.fn();
    mocks.createClient.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
      from,
    });

    await expect(
      createProfile({}, profileForm("PlayerOne", OTHER_USER_ID)),
    ).resolves.toEqual({
      message: "Your session has expired. Sign in again to save your profile.",
      status: "error",
    });
    expect(from).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
