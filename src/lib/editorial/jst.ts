/** Tokyo calendar helpers for editorial picks. Not used by the taste map. */

export function jstDateKey(now: Date | number = Date.now()): string {
  const date = typeof now === "number" ? new Date(now) : now;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

/** 1–12 in Asia/Tokyo. */
export function jstMonth(now: Date | number = Date.now()): number {
  const [, month] = jstDateKey(now).split("-");
  return Number(month);
}

export function fnv1a(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
