import type { HomeData, Occurrence } from "@/lib/data/home";
import { categoryStyle } from "@/lib/categories";
import { WEEKDAYS, dayNumber, hhmm, monthShort, weekday } from "@/lib/dates";
import { Card, CardTitle, CategoryTag, Icons, RideChip } from "./ui";

function RideRow({ o, data }: { o: Occurrence; data: HomeData }) {
  const s = categoryStyle(o.event.category);
  const kids = data.children.filter((c) => o.event.childIds.includes(c.id)).map((c) => c.name);
  const r = o.ride;
  return (
    <li className="flex items-start gap-4 border-t border-black/5 py-4 first:border-t-0">
      <div className="flex w-14 shrink-0 flex-col items-center rounded-2xl py-2 leading-tight" style={{ background: s.bg, color: s.fg }}>
        <span className="text-[11px] font-bold uppercase">{o.date === data.today ? "Today" : WEEKDAYS[weekday(o.date)]}</span>
        <span className="text-xl font-bold">{dayNumber(o.date)}</span>
        <span className="text-[11px] font-semibold">{monthShort(o.date)}</span>
      </div>
      <div className="flex min-w-0 grow flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-medium text-ink-3">{hhmm(o.event.start_time)}</span>
          <CategoryTag category={o.event.category} activity={o.event.activity} />
        </div>
        <span className="font-semibold text-ink">{o.event.title}</span>
        <span className="text-sm text-ink-3">
          {o.event.place}
          {kids.length ? ` · for ${kids.join(" and ")}` : ""}
        </span>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <RideChip o={o} meId={data.me.id} />
          {r?.pickup && (
            <span className="text-xs text-ink-3">
              Pick-up {hhmm(r.pickup_time)} · {r.pickup}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

export function RidesCard({ data }: { data: HomeData }) {
  const all = data.upcoming;
  const set = all.filter((o) => o.ride).length;
  const shown = all.slice(0, 4);
  const more = all.slice(4);
  return (
    <Card label="Rides">
      <CardTitle icon={Icons.car} aside={<span className="text-sm text-ink-3">{set} of {all.length} set · today and next 2 weeks</span>}>
        Rides
      </CardTitle>
      {all.length ? (
        <>
          <ul className="m-0 mt-3 list-none p-0">{shown.map((o) => <RideRow key={o.event.id + o.date} o={o} data={data} />)}</ul>
          {more.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer list-none rounded-full px-1 py-2 text-sm font-semibold text-p500 hover:text-p600 [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">Show all {all.length} rides</span>
                <span className="hidden group-open:inline">Show less</span>
              </summary>
              <ul className="m-0 list-none p-0">{more.map((o) => <RideRow key={o.event.id + o.date} o={o} data={data} />)}</ul>
            </details>
          )}
        </>
      ) : (
        <p className="mt-3 mb-0 text-sm text-ink-3">No activities that need a ride in the next two weeks.</p>
      )}
    </Card>
  );
}
