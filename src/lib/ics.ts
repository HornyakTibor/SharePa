// A small .ics (iCalendar) reader: turns a calendar export into weekly SharePa events.
// It keeps weekly repeating events and one-off events in the next 14 days. Times are shown in Budapest time.

export type ImportedEvent = { title: string; place: string; weekday: number; time: string };

const TZ = "Europe/Budapest";
const DAY_CODES = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

function unfold(text: string): string[] {
  return text.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "").split("\n");
}

const unescape = (v: string) => v.replace(/\\n/gi, " ").replace(/\\([,;\\])/g, "$1").trim();

type Stamp = { date: string; time: string } | null; // Budapest date "YYYY-MM-DD" + "HH:MM"

/** Reads a DTSTART line (with its parameters) into Budapest date + time. All-day events return null. */
function readStart(params: string, value: string): Stamp {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!m || !m[4]) return null; // all-day events don't need a ride time
  const [, y, mo, d, h, mi, , z] = m;
  const tzid = params.match(/TZID=([^;:]+)/)?.[1];
  if (!z && (!tzid || tzid === TZ)) return { date: `${y}-${mo}-${d}`, time: `${h}:${mi}` };

  // Convert from UTC (or another time zone) to Budapest time.
  let utc = Date.UTC(+y, +mo - 1, +d, +h, +mi);
  if (!z && tzid) {
    try {
      const local = new Date(new Date(utc).toLocaleString("en-US", { timeZone: tzid }));
      const asUtc = new Date(new Date(utc).toLocaleString("en-US", { timeZone: "UTC" }));
      utc += asUtc.getTime() - local.getTime();
    } catch {
      /* unknown time zone: keep the clock time as written */
    }
  }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(utc));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour").replace("24", "00")}:${get("minute")}` };
}

const weekdayOf = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
};

export function parseIcs(text: string, todayIso: string, endIso: string): ImportedEvent[] {
  const out = new Map<string, ImportedEvent>();
  let cur: Record<string, { params: string; value: string }> | null = null;

  for (const line of unfold(text)) {
    if (line === "BEGIN:VEVENT") { cur = {}; continue; }
    if (line === "END:VEVENT" && cur) {
      const title = unescape(cur.SUMMARY?.value ?? "");
      const start = cur.DTSTART ? readStart(cur.DTSTART.params, cur.DTSTART.value) : null;
      const rule = cur.RRULE?.value ?? "";
      const place = unescape(cur.LOCATION?.value ?? "").slice(0, 160);
      const cancelled = cur.STATUS?.value === "CANCELLED";
      cur = null;
      if (!title || !start || cancelled) continue;
      const add = (weekday: number) => {
        const key = `${title.toLowerCase()}|${weekday}|${start.time}`;
        if (!out.has(key)) out.set(key, { title: title.slice(0, 120), place, weekday, time: start.time });
      };
      if (/FREQ=WEEKLY/.test(rule)) {
        const until = rule.match(/UNTIL=(\d{8})/)?.[1];
        if (until && `${until.slice(0, 4)}-${until.slice(4, 6)}-${until.slice(6, 8)}` < todayIso) continue;
        if (start.date > endIso) continue;
        const days = rule.match(/BYDAY=([A-Z,0-9+-]+)/)?.[1];
        const list = days ? days.split(",").map((c) => DAY_CODES.indexOf(c.replace(/[^A-Z]/g, ""))).filter((n) => n >= 0) : [weekdayOf(start.date)];
        list.forEach(add);
      } else if (!rule && start.date >= todayIso && start.date <= endIso) {
        add(weekdayOf(start.date));
      }
      continue;
    }
    if (!cur) continue;
    const m = line.match(/^([A-Z-]+)((?:;[^:]*)?):(.*)$/);
    if (m && ["SUMMARY", "LOCATION", "DTSTART", "RRULE", "STATUS"].includes(m[1])) cur[m[1]] = { params: m[2], value: m[3] };
  }
  return [...out.values()].slice(0, 60);
}
