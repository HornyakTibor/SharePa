import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, nowTime, startOfWeek, today, weekday } from "@/lib/dates";

export type Child = { id: string; name: string };
export type EventRow = {
  id: string;
  title: string;
  place: string | null;
  placeLat: number | null;
  placeLng: number | null;
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
  pickupLat: number | null;
  pickupLng: number | null;
  pickup_time: string | null;
  status: "offered" | "confirmed" | "cancelled";
  passengerIds: string[];
};
export type Friend = { id: string; name: string; labels: string[] };
export type RideMode = "join" | "drive" | "none";
export type RideChoice = { mode: RideMode; childIds: string[]; notifiedIds: string[]; note: string | null };
export type Occurrence = {
  event: EventRow;
  date: string;
  /** Best ride for this occurrence (confirmed beats offered), whoever drives. */
  ride: Ride | null;
  /** The parent's own offered ride, if they drive. */
  myRide: Ride | null;
  /** Open driving offers from friends, waiting for approval. */
  offers: Ride[];
  choice: RideChoice | null;
  past: boolean;
};

export type Notification = {
  id: string;
  kind: "request" | "seats" | "offer" | "confirmed" | "declined" | "friend";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  eventId: string | null;
  rideDate: string | null;
};

export type HomeData = {
  me: {
    id: string;
    name: string;
    isDemo: boolean;
    address: string | null;
    homeLat: number | null;
    homeLng: number | null;
    onboarded: boolean;
    /** The default pick-up point when it isn't home. */
    defaultPickup: { address: string; lat: number | null; lng: number | null } | null;
  };
  today: string;
  week: { date: string; items: Occurrence[] }[];
  upcoming: Occurrence[];
  children: Child[];
  friends: Friend[];
  activities: { label: string; category: string | null; perWeek: number }[];
  ridesPerChild: Record<string, number>;
  notifications: Notification[];
  /** "eventId_date" of an offers dialog to open on load (from a notification link). */
  openOffers?: string;
};

const UPCOMING_DAYS = 14;

/** Everything the home page shows, read with the parent's own permissions. */
export async function loadHome(supabase: SupabaseClient, userId: string): Promise<HomeData> {
  const now = today();
  const time = nowTime();
  const weekStart = startOfWeek(now);
  const rangeEnd = addDays(now, UPCOMING_DAYS - 1);
  const ridesFrom = weekStart < now ? weekStart : now;

  const [profileRes, childrenRes, eventsRes, friendsRes, notifRes] = await Promise.all([
    supabase.from("profiles").select("full_name, is_demo, address, home_lat, home_lng, onboarded_at, pickup_points, default_pickup").eq("id", userId).maybeSingle(),
    supabase.from("children").select("id, name").eq("parent_id", userId).order("name"),
    supabase
      .from("events")
      .select("id, title, place, place_lat, place_lng, category, activity, weekday, start_time, needs_ride, event_children(child_id)")
      .eq("owner_id", userId)
      .eq("hidden", false)
      .order("start_time"),
    supabase
      .from("friendships")
      .select("labels, friend:profiles!friendships_friend_id_fkey(id, full_name)")
      .eq("user_id", userId),
    supabase
      .from("notifications")
      .select("id, kind, title, body, created_at, read_at, event_id, ride_date")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const events: EventRow[] = (eventsRes.data ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    place: e.place,
    placeLat: e.place_lat,
    placeLng: e.place_lng,
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
      .select("id, event_id, ride_date, driver_id, seats, pickup, pickup_lat, pickup_lng, pickup_time, status, driver:profiles!rides_driver_id_fkey(full_name), ride_passengers(child_id)")
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
      pickupLat: r.pickup_lat,
      pickupLng: r.pickup_lng,
      pickup_time: r.pickup_time,
      status: r.status,
      passengerIds: (r.ride_passengers ?? []).map((p: { child_id: string }) => p.child_id),
    }));
  }

  const choices = new Map<string, RideChoice>();
  if (events.length) {
    const { data } = await supabase
      .from("ride_choices")
      .select("event_id, ride_date, mode, child_ids, notified_ids, note")
      .eq("parent_id", userId)
      .gte("ride_date", ridesFrom)
      .lte("ride_date", rangeEnd);
    (data ?? []).forEach((c) =>
      choices.set(`${c.event_id}|${c.ride_date}`, { mode: c.mode, childIds: c.child_ids ?? [], notifiedIds: c.notified_ids ?? [], note: c.note }),
    );
  }

  /** The ride for one occurrence: a confirmed one wins over an offer. */
  const rideFor = (eventId: string, date: string) => {
    const matches = rides.filter((r) => r.event_id === eventId && r.ride_date === date);
    return matches.find((r) => r.status === "confirmed") ?? matches[0] ?? null;
  };
  const occurrence = (event: EventRow, date: string): Occurrence => {
    const myRide = rides.find((r) => r.event_id === event.id && r.ride_date === date && r.driver_id === userId) ?? null;
    let choice = choices.get(`${event.id}|${date}`) ?? null;
    // A ride the parent offers counts as the "drive" choice even without a saved choice (e.g. demo seed data).
    if (!choice && myRide) choice = { mode: "drive", childIds: [], notifiedIds: [], note: null };
    return {
      event,
      date,
      ride: event.needs_ride ? rideFor(event.id, date) : null,
      myRide,
      offers: rides.filter((r) => r.event_id === event.id && r.ride_date === date && r.driver_id !== userId && r.status === "offered"),
      choice,
      past: date < now || (date === now && event.start_time.slice(0, 5) < time),
    };
  };

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
    me: {
      id: userId,
      name: profileRes.data?.full_name || "there",
      isDemo: Boolean(profileRes.data?.is_demo),
      address: profileRes.data?.address ?? null,
      homeLat: profileRes.data?.home_lat ?? null,
      homeLng: profileRes.data?.home_lng ?? null,
      onboarded: Boolean(profileRes.data?.onboarded_at),
      defaultPickup: defaultPickup(profileRes.data?.pickup_points, profileRes.data?.default_pickup),
    },
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
    notifications: (notifRes.data ?? []).map((n) => ({
      id: n.id,
      kind: n.kind,
      title: n.title,
      body: n.body,
      createdAt: n.created_at,
      read: Boolean(n.read_at),
      eventId: n.event_id,
      rideDate: n.ride_date,
    })),
  };
}

/** The parent's chosen default pick-up point ("Name, address" + map point), or null for home. */
function defaultPickup(points: unknown, id: string | null | undefined): HomeData["me"]["defaultPickup"] {
  if (!id || id === "home" || !Array.isArray(points)) return null;
  const p = points.find((x) => x?.id === id);
  return p ? { address: `${p.name}, ${p.address}`, lat: p.lat ?? null, lng: p.lng ?? null } : null;
}
