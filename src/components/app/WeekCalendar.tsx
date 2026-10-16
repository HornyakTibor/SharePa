import Link from "next/link";
import type { CalendarMode, HomeData, Occurrence } from "@/lib/data/home";
import { categoryStyle } from "@/lib/categories";
import { WEEKDAYS, addDays, hhmm, longDate, monthShort, shortDate, startOfWeek, weekday } from "@/lib/dates";
import { Card, CategoryTag, Icons, rideStatus } from "./ui";
import { OccurrenceRide } from "./OccurrenceRide";

const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MODES: { key: CalendarMode; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

/** Link to another calendar view; the list/calendar tab stays on the calendar. */
const calHref = (mode: CalendarMode, date: string) => `/app?cal=${mode}&d=${date}`;

/** Same day in the previous/next month (clamped to that month's length). */
function shiftMonth(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + n, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, last));
  return target.toISOString().slice(0, 10);
}

function EventCard({ o, data }: { o: Occurrence; data: HomeData }) {
  const s = categoryStyle(o.event.category);
  return (
    <div
      className={`relative flex flex-col gap-1.5 overflow-hidden rounded-2xl bg-white py-3 pr-3 pl-4 shadow-[0_2px_8px_rgba(9,16,29,.06)] ${o.past ? "opacity-55" : ""}`}
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1" style={{ background: o.event.category ? s.fg : "#cdcfd2" }} />
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-medium text-ink-3">{hhmm(o.event.start_time)}</span>
        {o.past && <span className="rounded-md bg-canvas px-1.5 py-0.5 text-[11px] font-semibold text-ink-3">Past</span>}
      </div>
      <span className="text-sm leading-snug font-semibold text-ink">{o.event.title}</span>
      {o.event.place && <span className="text-xs leading-snug text-ink-3">{o.event.place}</span>}
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        <CategoryTag category={o.event.category} activity={o.event.activity} />
      </div>
      <OccurrenceRide o={o} data={data} compact />
    </div>
  );
}

/** Wide event row for the day view: everything on one line where there's room. */
function DayEvent({ o, data }: { o: Occurrence; data: HomeData }) {
  const s = categoryStyle(o.event.category);
  return (
    <div className={`relative flex flex-wrap items-start gap-x-6 gap-y-3 overflow-hidden rounded-2xl bg-white py-3.5 pr-4 pl-5 shadow-[0_2px_8px_rgba(9,16,29,.06)] ${o.past ? "opacity-55" : ""}`}>
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5" style={{ background: o.event.category ? s.fg : "#cdcfd2" }} />
      <div className="flex min-w-[200px] flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-medium text-ink-3">{hhmm(o.event.start_time)}</span>
          <span className="font-semibold text-ink">{o.event.title}</span>
          {o.past && <span className="rounded-md bg-canvas px-1.5 py-0.5 text-[11px] font-semibold text-ink-3">Past</span>}
        </div>
        {o.event.place && <span className="text-sm text-ink-3">{o.event.place}</span>}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          <CategoryTag category={o.event.category} activity={o.event.activity} />
          {!o.event.needs_ride && <span className="text-xs text-ink-3">No ride needed</span>}
        </div>
      </div>
      <div className="min-w-[220px]">
        <OccurrenceRide o={o} data={data} />
      </div>
    </div>
  );
}

function DayView({ data }: { data: HomeData }) {
  const day = data.cal.days[0];
  const hours = day.items.map((o) => Number(o.event.start_time.slice(0, 2)));
  const from = Math.min(7, ...hours);
  const to = Math.max(20, ...hours);
  const nowHour = day.date === data.today ? Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Budapest", hour: "2-digit", hour12: false }).format(new Date())) : -1;
  return (
    <ol className="m-0 flex list-none flex-col p-0" aria-label={`Events on ${longDate(day.date)}`}>
      {Array.from({ length: to - from + 1 }, (_, k) => from + k).map((h) => {
        const here = day.items.filter((o) => Number(o.event.start_time.slice(0, 2)) === h);
        return (
          <li key={h} className={`grid grid-cols-[52px_minmax(0,1fr)] gap-3 border-t py-2 first:border-t-0 ${h === nowHour ? "border-p500" : "border-black/5"}`}>
            <span className={`pt-1 font-mono text-xs ${h === nowHour ? "font-bold text-p500" : "text-ink-3"}`}>{String(h).padStart(2, "0")}:00</span>
            <div className="flex min-h-7 flex-col gap-2">
              {here.map((o) => <DayEvent key={o.event.id} o={o} data={data} />)}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function WeekView({ data }: { data: HomeData }) {
  return (
    <div className="-mx-2 overflow-x-auto px-2 pb-2">
      <div className="grid min-w-[980px] grid-cols-7 gap-3">
        {data.cal.days.map((day) => {
          const isToday = day.date === data.today;
          return (
            <div key={day.date} className={`flex flex-col gap-2 rounded-[20px] p-2 ${isToday ? "bg-p100" : "bg-canvas"}`}>
              <Link
                href={calHref("day", day.date)}
                scroll={false}
                title={`Open ${longDate(day.date)}`}
                className={`flex items-baseline justify-between rounded-xl px-2 py-1.5 no-underline transition-colors ${isToday ? "bg-p500 text-white hover:bg-p600" : "text-ink-2 hover:bg-white"}`}
              >
                <span className="text-sm font-bold">{WEEKDAYS[weekday(day.date)]}</span>
                <span className="text-xs font-semibold">{isToday ? "Today" : `${Number(day.date.slice(8))} ${monthShort(day.date)}`}</span>
              </Link>
              {day.items.length ? (
                day.items.map((o) => <EventCard key={o.event.id} o={o} data={data} />)
              ) : (
                <p className="m-0 px-2 py-3 text-xs text-ink-3">Nothing planned</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Small coloured chip in a month cell: time, title and a tick when the ride is sorted. */
function MonthChip({ o, meId }: { o: Occurrence; meId: string }) {
  const s = categoryStyle(o.event.category);
  const st = rideStatus(o, meId);
  const sorted = st?.tone === "ok" || st?.tone === "mine";
  const open = !o.past && o.event.needs_ride && !sorted && st?.tone !== "none";
  return (
    <span
      className={`flex min-w-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] leading-tight font-semibold ${o.past || !o.event.needs_ride ? "opacity-55" : ""}`}
      style={{ background: s.bg, color: s.fg }}
      title={`${hhmm(o.event.start_time)} ${o.event.title}${st ? ` · ${st.text}` : ""}`}
    >
      <span className="font-mono font-medium">{hhmm(o.event.start_time)}</span>
      <span className="truncate">{o.event.title}</span>
      {sorted && <span aria-label="ride sorted" className="ml-auto shrink-0 text-ok">✓</span>}
      {open && <span aria-label="ride open" className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[#c2410c]" />}
    </span>
  );
}

function MonthView({ data }: { data: HomeData }) {
  const month = data.cal.anchor.slice(0, 7);
  return (
    <div className="-mx-2 overflow-x-auto px-2 pb-2">
      <div className="grid min-w-[700px] grid-cols-7 gap-1.5">
        {WEEKDAYS.map((w) => (
          <span key={w} className="px-1.5 pb-1 text-[11px] font-semibold tracking-[.08em] text-ink-3 uppercase">{w}</span>
        ))}
        {data.cal.days.map((day) => {
          const isToday = day.date === data.today;
          const out = day.date.slice(0, 7) !== month;
          const shown = day.items.slice(0, 3);
          return (
            <div
              key={day.date}
              className={`flex min-h-[104px] min-w-0 flex-col gap-1 rounded-xl p-1.5 ${isToday ? "bg-p100 shadow-[inset_0_0_0_2px_#5833A7]" : "bg-canvas"} ${out ? "opacity-50" : ""}`}
            >
              <Link
                href={calHref("day", day.date)}
                scroll={false}
                aria-label={`Open ${longDate(day.date)}${day.items.length ? `, ${day.items.length} event${day.items.length === 1 ? "" : "s"}` : ""}`}
                className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold no-underline ${isToday ? "bg-p500 text-white" : "text-ink-2 hover:bg-white"}`}
              >
                {Number(day.date.slice(8))}
              </Link>
              {shown.map((o) => <MonthChip key={o.event.id} o={o} meId={data.me.id} />)}
              {day.items.length > 3 && (
                <Link href={calHref("day", day.date)} scroll={false} className="px-1 text-[11px] font-semibold text-p500 no-underline hover:text-p600">
                  +{day.items.length - 3} more
                </Link>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 mb-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-3">
        <span><span className="text-ok">✓</span> Ride sorted</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-1.5 w-1.5 rounded-full bg-[#c2410c]" />Still needs a ride</span>
        <span>Click a day to manage its rides.</span>
      </p>
    </div>
  );
}

/** Home calendar with Day / Week / Month views, as in the prototype. Navigation is plain links (?cal=…&d=…). */
export function WeekCalendar({ data }: { data: HomeData }) {
  const { mode, anchor, days } = data.cal;
  const step = (n: number) => (mode === "day" ? addDays(anchor, n) : mode === "week" ? addDays(anchor, 7 * n) : shiftMonth(anchor, n));
  const first = days[0].date;
  const last = days[days.length - 1].date;
  const title =
    mode === "day"
      ? `${longDate(anchor)}${anchor === data.today ? " · Today" : ""}`
      : mode === "week"
        ? `${shortDate(first)} – ${shortDate(last)} ${last.slice(0, 4)}`
        : `${MONTHS_LONG[Number(anchor.slice(5, 7)) - 1]} ${anchor.slice(0, 4)}`;
  const showsToday = mode === "day" ? anchor === data.today : mode === "week" ? startOfWeek(anchor) === startOfWeek(data.today) : anchor.slice(0, 7) === data.today.slice(0, 7);
  const navBtn = "grid h-10 w-10 place-items-center rounded-full bg-canvas text-ink-2 no-underline hover:bg-p100";
  const unit = mode === "day" ? "day" : mode === "week" ? "week" : "month";

  return (
    <div data-tour="week" id="calendar" className="scroll-mt-24">
      <Card label="Calendar">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden h-9 w-9 shrink-0 place-items-center rounded-xl bg-p100 text-p500 sm:grid">{Icons.calendar}</span>
            <Link href={calHref(mode, step(-1))} scroll={false} aria-label={`Previous ${unit}`} className={navBtn}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z" /></svg>
            </Link>
            <Link
              href={calHref(mode, data.today)}
              scroll={false}
              aria-disabled={showsToday}
              className={`rounded-full px-4 py-2 text-sm font-bold no-underline ${showsToday ? "pointer-events-none bg-canvas text-ink-3" : "bg-p100 text-p600 hover:bg-p200"}`}
            >
              Today
            </Link>
            <Link href={calHref(mode, step(1))} scroll={false} aria-label={`Next ${unit}`} className={navBtn}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6z" /></svg>
            </Link>
            <h2 className="m-0 ml-1 min-w-0 truncate text-xl font-semibold text-navy" aria-live="polite">{title}</h2>
          </div>
          <div role="group" aria-label="Calendar view" className="inline-flex gap-1 rounded-full bg-canvas p-1">
            {MODES.map((m) => (
              <Link
                key={m.key}
                href={calHref(m.key, anchor)}
                scroll={false}
                aria-current={mode === m.key ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm font-bold no-underline transition-colors ${mode === m.key ? "bg-white text-p600 shadow-[0_1px_3px_rgba(10,15,28,.12)]" : "text-ink-3 hover:text-ink"}`}
              >
                {m.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-5">
          {mode === "day" ? (
            days[0].items.length ? (
              <DayView data={data} />
            ) : (
              <p className="m-0 rounded-2xl bg-canvas px-4 py-10 text-center text-sm text-ink-3">Nothing planned on this day.</p>
            )
          ) : mode === "week" ? (
            <WeekView data={data} />
          ) : (
            <MonthView data={data} />
          )}
        </div>
      </Card>
    </div>
  );
}
