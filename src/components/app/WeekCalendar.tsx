import type { HomeData, Occurrence } from "@/lib/data/home";
import { categoryStyle } from "@/lib/categories";
import { WEEKDAYS, addDays, hhmm, monthShort, shortDate } from "@/lib/dates";
import { Card, CardTitle, CategoryTag, Icons } from "./ui";
import { OccurrenceRide } from "./OccurrenceRide";

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

export function WeekCalendar({ data }: { data: HomeData }) {
  const start = data.week[0].date;
  const end = addDays(start, 6);
  return (
    <Card label="This week">
      <CardTitle icon={Icons.calendar} aside={<span className="text-sm text-ink-3">{shortDate(start)} – {shortDate(end)} {end.slice(0, 4)}</span>}>
        This week
      </CardTitle>
      <div className="mt-5 -mx-2 overflow-x-auto px-2 pb-2">
        <div className="grid min-w-[980px] grid-cols-7 gap-3">
          {data.week.map((day, i) => {
            const isToday = day.date === data.today;
            return (
              <div key={day.date} className={`flex flex-col gap-2 rounded-[20px] p-2 ${isToday ? "bg-p100" : "bg-canvas"}`}>
                <div className={`flex items-baseline justify-between rounded-xl px-2 py-1.5 ${isToday ? "bg-p500 text-white" : "text-ink-2"}`}>
                  <span className="text-sm font-bold">{WEEKDAYS[i]}</span>
                  <span className="text-xs font-semibold">{isToday ? "Today" : `${Number(day.date.slice(8))} ${monthShort(day.date)}`}</span>
                </div>
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
    </Card>
  );
}
