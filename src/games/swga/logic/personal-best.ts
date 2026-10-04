export type PersonalBestResult =
  | { status: "known"; score: number }
  | { status: "no-history" | "signed-out" | "unavailable" };

export interface PersonalBestSnapshot {
  revision: string;
  userId: string | null;
  result: PersonalBestResult;
}

export interface PersonalBestRefresh {
  revision: string;
  userId: string | null;
  minimumScore: number;
}

export const unavailablePersonalBest: PersonalBestSnapshot = {
  revision: "initial",
  userId: null,
  result: { status: "unavailable" },
};

// A successful submission alone cannot tell us the account's maximum: another
// device may have saved a higher score. Require a fresh, user-scoped server read.
export function currentPersonalBest(
  snapshot: PersonalBestSnapshot,
  refresh: PersonalBestRefresh | null,
): PersonalBestResult | { status: "refreshing" } {
  if (!refresh) return snapshot.result;
  if (snapshot.revision === refresh.revision) return { status: "refreshing" };
  if (snapshot.userId !== refresh.userId) return snapshot.result;
  if (snapshot.result.status === "known" && snapshot.result.score >= refresh.minimumScore) {
    return snapshot.result;
  }
  return { status: "unavailable" };
}

export function exceededPersonalBest(
  previous: PersonalBestSnapshot | null,
  userId: string | null,
  score: number,
) {
  return previous?.userId === userId &&
    previous?.result.status === "known" && score > previous.result.score;
}
