import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, nowTime, startOfWeek, today, weekday } from "@/lib/dates";

export type Child = { id: string; name: string };
export type EventRow = {
  id: string;
  title: string;
  place: string | null;
  category: string | null;
  activity: string | null;
  weekday: number;
  start_time: string;
  needs_ride: boolean;
  childIds: string[];
};
export type Ride = {
  id: string;
  event_id: string;
  ride_date: string;
  driver_id: string;
  driverName: string;
  seats: number;
  pickup: string | null;
  pickup_time: string | null;
  status: "offered" | "confirmed" | "cancelled";
  passengerIds: string[];
};
export type Friend = { id: string; name: string; labels: string[] };
export type Occurrence = { event: EventRow; date: string; ride: Ride | null; past: boolean };

export type HomeData = {
  me: { id: string; name: string; isDemo: boolean };
  today: string;
  week: { date: string; items: Occurrence[] }[];
  upcoming: Occurrence[];
  children: Child[];
  friends: Friend[];
  activities: { label: string; category: string | null; perWeek: number }[];
  ridesPerChild: Record<string, number>;
};

const UPCOMING_DAYS = 14;

/** Everything the home page shows, read with the parent's own permissions. */
export async function loadHome(supabase: SupabaseClient, userId: string): Promise<HomeData> {
  const now = today();
  const time = nowTime();
  const weekStart = startOfWeek(now);
  const rangeEnd = addDays(now, UPCOMING_DAYS - 1);
  const ridesFrom = weekStart < now ? weekStart : now;

  const [profileRes, childrenRes, eventsRes, friendsRes] = await Promise.all([
    supabase.from("profiles").select("full_name, is_demo").eq("id", userId).maybeSingle(),
    supabase.from("children").select("id, name").eq("parent_id", userId).order("name"),
    supabase
      .from("events")
      .select("id, title, place, category, activity, weekday, start_time, needs_ride, event_children(child_id)")
      .eq("owner_id", userId)
      .order("start_time"),
    supabase
      .from("friendships")
      .select("labels, friend:profiles!friendships_friend_id_fkey(id, full_name)")
      .eq("user_id", userId),
  ]);

  const events: EventRow[] = (eventsRes.data ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    place: e.place,
    category: e.category,
    activity: e.activity,
    weekday: e.weekday,
    start_time: e.start_time,
    needs_ride: e.needs_ride,
    childIds: (e.event_children ?? []).map((c: { child_id: string }) => c.child_id),
  }));

  let rides: Ride[] = [];
  if (events.length) {
    const { data } = await supabase
      .from("rides")
      .select("id, event_id, ride_date, driver_id, seats, pickup, pickup_time, status, driver:profiles!rides_driver_id_fkey(full_name), ride_passengers(child_id)")
      .in("event_id", events.map((e) => e.id))
      .gte("ride_date", ridesFrom)
      .lte("ride_date", rangeEnd)
      .neq("status", "cancelled");
    rides = (data ?? []).map((r) => ({
      id: r.id,
      event_id: r.event_id,
      ride_date: r.ride_date,
      driver_id: r.driver_id,
      driverName: (r.driver as unknown as { full_name: string } | null)?.full_name ?? "A friend",
      seats: r.seats,
      pickup: r.pickup,
      pickup_time: r.pickup_time,
      status: r.status,
      passengerIds: (r.ride_passengers ?? []).map((p: { child_id: string }) => p.child_id),
    }));
  }

  /** The ride for one occurrence: a confirmed one wins over an offer. */
  const rideFor = (eventId: string, date: string) => {
    const matches = rides.filter((r) => r.event_id === eventId && r.ride_date === date);
    return matches.find((r) => r.status === "confirmed") ?? matches[0] ?? null;
  };
  const occurrence = (event: EventRow, date: string): Occurrence => ({
    event,
    date,
    ride: event.needs_ride ? rideFor(event.id, date) : null,
    past: date < now || (date === now && event.start_time.slice(0, 5) < time),
  });

  const week = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return { date, items: events.filter((e) => e.weekday === i).map((e) => occurrence(e, date)) };
  });

  const upcoming: Occurrence[] = [];
  for (let i = 0; i < UPCOMING_DAYS; i++) {
    const date = addDays(now, i);
    events
      .filter((e) => e.needs_ride && e.weekday === weekday(date))
      .forEach((e) => {
        const o = occurrence(e, date);
        if (!o.past) upcoming.push(o);
      });
  }

  const actMap = new Map<string, { label: string; category: string | null; perWeek: number }>();
  events
    .filter((e) => e.category)
    .forEach((e) => {
      const label = [e.category, e.activity].filter(Boolean).join(" · ");
      const cur = actMap.get(label) ?? { label, category: e.category, perWeek: 0 };
      cur.perWeek += 1;
      actMap.set(label, cur);
    });

  const ridesPerChild: Record<string, number> = {};
  rides
    .filter((r) => r.ride_date >= now)
    .forEach((r) => r.passengerIds.forEach((id) => (ridesPerChild[id] = (ridesPerChild[id] ?? 0) + 1)));

  return {
    me: { id: userId, name: profileRes.data?.full_name || "there", isDemo: Boolean(profileRes.data?.is_demo) },
    today: now,
    week,
    upcoming,
    children: childrenRes.data ?? [],
    friends: (friendsRes.data ?? [])
      .map((f) => {
        const p = f.friend as unknown as { id: string; full_name: string } | null;
        return p ? { id: p.id, name: p.full_name, labels: f.labels ?? [] } : null;
      })
      .filter((f): f is Friend => f !== null)
      .sort((a, b) => a.name.localeCompare(b.name, "hu")),
    activities: [...actMap.values()].sort((a, b) => a.label.localeCompare(b.label)),
    ridesPerChild,
  };
}
