const newYorkFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  month: "short",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
  timeZoneName: "short",
});

/** Format a stored timestamp for display while preserving its absolute instant. */
export function formatRankedTimestamp(value: unknown) {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = Object.fromEntries(
    newYorkFormatter.formatToParts(date).map(({ type, value }) => [type, value]),
  );
  return {
    label: `${parts.month} ${parts.day}, ${parts.year.padStart(4, "0")} at ${parts.hour}:${parts.minute}:${parts.second} ${parts.timeZoneName}`,
    dateTime: date.toISOString(),
  };
}
