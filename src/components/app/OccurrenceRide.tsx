import type { HomeData, Occurrence } from "@/lib/data/home";
import { WEEKDAYS, hhmm, shortDate, weekday } from "@/lib/dates";
import { RideControl } from "./RideControl";
import { OffersButton } from "./OffersButton";
import { RideChip, rideDetail } from "./ui";

/** Ride status chip, the one-line detail and the Manage ride menu for one event occurrence. */
export function OccurrenceRide({ o, data, compact = false }: { o: Occurrence; data: HomeData; compact?: boolean }) {
  if (!o.event.needs_ride) return null;
  const names = (ids: string[]) => data.children.filter((c) => ids.includes(c.id)).map((c) => c.name);
  const detail = rideDetail(o, data.me.id, names);
  return (
    <div className={`flex flex-col gap-1.5 ${compact ? "items-stretch" : "items-start"}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        {!o.past && <RideChip o={o} meId={data.me.id} />}
        {!compact && detail && !o.past && <span className="text-xs text-ink-3">{detail}</span>}
      </div>
      {compact && detail && !o.past && <span className="text-[11px] leading-snug text-ink-3">{detail}</span>}
      {!o.past && o.offers.length > 0 && !(o.ride && o.ride.status === "confirmed") && (
        <OffersButton
          offers={o.offers.map((r) => ({ id: r.id, driverName: r.driverName, seats: r.seats, pickup: r.pickup, pickupTime: r.pickup_time }))}
          title={o.event.title}
          when={`${WEEKDAYS[weekday(o.date)]} ${shortDate(o.date)} · ${hhmm(o.event.start_time)}`}
          kids={names(o.choice?.childIds ?? []).join(" and ")}
          compact={compact}
          autoOpen={!compact && data.openOffers === `${o.event.id}_${o.date}`}
        />
      )}
      {!o.past && (
        <RideControl
          eventId={o.event.id}
          title={o.event.title}
          category={o.event.category}
          activity={o.event.activity}
          time={hhmm(o.event.start_time)}
          place={o.event.place}
          date={o.date}
          dateLabel={`${WEEKDAYS[weekday(o.date)]} ${shortDate(o.date)}`}
          mode={o.choice?.mode ?? null}
          compact={compact}
          kids={data.children}
          eventKidIds={o.event.childIds}
          friends={data.friends}
          homeAddress={data.me.address}
          defaultPickup={data.me.defaultPickup}
          firstName={data.me.name.split(" ")[0]}
          myRide={o.myRide ? { seats: o.myRide.seats, pickup: o.myRide.pickup, pickupTime: o.myRide.pickup_time } : null}
        />
      )}
    </div>
  );
}
