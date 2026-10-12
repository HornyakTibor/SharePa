// Dates are handled as "YYYY-MM-DD" strings in Budapest time, so a day never shifts across time zones.

const TZ = "Europe/Budapest";
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Today's date in Budapest, e.g. "2026-10-12". */
export function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

/** Current time in Budapest, e.g. "16:05". */
export function nowTime(): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
}

const toUTC = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

export function addDays(iso: string, n: number): string {
  const d = toUTC(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** 0 = Monday … 6 = Sunday */
export function weekday(iso: string): number {
  return (toUTC(iso).getUTCDay() + 6) % 7;
}

export function startOfWeek(iso: string): string {
  return addDays(iso, -weekday(iso));
}

export function dayNumber(iso: string): number {
  return toUTC(iso).getUTCDate();
}

export function monthShort(iso: string): string {
  return MONTHS[toUTC(iso).getUTCMonth()];
}

/** "12 Oct" */
export function shortDate(iso: string): string {
  return `${dayNumber(iso)} ${monthShort(iso)}`;
}

/** "Monday, 12 October 2026" */
export function longDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(toUTC(iso));
}

/** "16:30:00" → "16:30" */
export const hhmm = (t: string | null | undefined) => (t ?? "").slice(0, 5);
