import { describe, expect, it } from "vitest";
import { formatRankedTimestamp } from "./format-ranked-timestamp";

describe("ranked timestamps in New York", () => {
  it.each([
    ["2026-09-02T20:15:00Z", "Sep 02, 2026 at 16:15:00 EDT", "2026-09-02T20:15:00.000Z"],
    ["2026-01-02T20:15:00Z", "Jan 02, 2026 at 15:15:00 EST", "2026-01-02T20:15:00.000Z"],
    ["2026-09-02T02:15:00Z", "Sep 01, 2026 at 22:15:00 EDT", "2026-09-02T02:15:00.000Z"],
    ["2026-01-01T02:15:00Z", "Dec 31, 2025 at 21:15:00 EST", "2026-01-01T02:15:00.000Z"],
    ["2026-09-02T04:00:00Z", "Sep 02, 2026 at 00:00:00 EDT", "2026-09-02T04:00:00.000Z"],
    // Spring skips 02:00; autumn repeats 01:00 with a different suffix.
    ["2026-03-08T06:59:59Z", "Mar 08, 2026 at 01:59:59 EST", "2026-03-08T06:59:59.000Z"],
    ["2026-03-08T07:00:00Z", "Mar 08, 2026 at 03:00:00 EDT", "2026-03-08T07:00:00.000Z"],
    ["2026-11-01T05:59:59Z", "Nov 01, 2026 at 01:59:59 EDT", "2026-11-01T05:59:59.000Z"],
    ["2026-11-01T06:00:00Z", "Nov 01, 2026 at 01:00:00 EST", "2026-11-01T06:00:00.000Z"],
    ["2026-09-01T03:04:05-04:00", "Sep 01, 2026 at 03:04:05 EDT", "2026-09-01T07:04:05.000Z"],
    ["2026-01-02T20:15:00+05:30", "Jan 02, 2026 at 09:45:00 EST", "2026-01-02T14:45:00.000Z"],
    ["2026-09-02T20:15:00.123456+00:00", "Sep 02, 2026 at 16:15:00 EDT", "2026-09-02T20:15:00.123Z"],
  ])("formats %s and retains its normalized instant", (input, label, dateTime) => {
    expect(formatRankedTimestamp(input)).toEqual({ label, dateTime });
  });

  it.each([undefined, null, 0, false, {}, [], "", "not-a-timestamp", "2026-13-02T20:15:00Z"])(
    "preserves controlled invalid-date handling for %j", (input) => {
      expect(formatRankedTimestamp(input)).toBeNull();
    },
  );
});
