import { describe, expect, it } from "vitest";
import {
  createTimerDeadline,
  formatRemainingTime,
  getRemainingTimeMs,
  hasTimerExpired,
  TIMED_RUN_DURATION_MS,
} from "../logic/timer";

describe("SWGA timed-run helpers", () => {
  it("starts with the full 60,000 millisecond duration", () => {
    const startedAtMs = 25_000;
    const deadlineMs = createTimerDeadline(startedAtMs);

    expect(deadlineMs - startedAtMs).toBe(TIMED_RUN_DURATION_MS);
    expect(getRemainingTimeMs(deadlineMs, startedAtMs)).toBe(60_000);
  });

  it("derives remaining time from the absolute deadline", () => {
    expect(getRemainingTimeMs(75_000, 42_500)).toBe(32_500);
  });

  it("clamps remaining time to zero after the deadline", () => {
    expect(getRemainingTimeMs(60_000, 60_001)).toBe(0);
    expect(hasTimerExpired(60_000, 60_001)).toBe(true);
  });

  it("formats the full duration and expiry conventionally", () => {
    expect(formatRemainingTime(60_000)).toBe("01:00");
    expect(formatRemainingTime(0)).toBe("00:00");
  });

  it("reflects elapsed background-style time immediately", () => {
    const deadlineMs = createTimerDeadline(1_000);

    expect(getRemainingTimeMs(deadlineMs, 46_000)).toBe(15_000);
    expect(formatRemainingTime(getRemainingTimeMs(deadlineMs, 46_000))).toBe(
      "00:15",
    );
    expect(getRemainingTimeMs(deadlineMs, 75_000)).toBe(0);
  });
});
