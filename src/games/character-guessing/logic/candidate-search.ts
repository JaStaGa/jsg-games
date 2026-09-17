export interface CandidateOption {
  readonly value: string;
  readonly label: string;
  readonly detail: string;
  readonly searchText: readonly string[];
}

export function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

/** Stable source order; every query token must occur in the candidate's search text. */
export function searchCandidates(options: readonly CandidateOption[], query: string): readonly CandidateOption[] {
  const normalized = normalizeSearch(query);
  if (!normalized) return [];
  const tokens = normalized.split(/\s+/);
  return options.filter((option) => {
    const text = normalizeSearch([option.value, ...option.searchText].join(" "));
    return tokens.every((token) => text.includes(token));
  });
}

/** Resolve before game validation; ambiguous/unknown text is never an engine guess. */
export function resolveCandidateQuery(options: readonly CandidateOption[], query: string): { value: string; error?: never } | { error: string; value?: never } {
  const exact = options.find((option) => option.value.trim().toLowerCase() === query.trim().toLowerCase());
  if (exact) return { value: exact.value };
  const matches = searchCandidates(options, query);
  if (matches.length === 1) return { value: matches[0].value };
  return { error: matches.length ? "Choose a specific candidate from the suggestions." : "No matching candidates. Try another search." };
}
