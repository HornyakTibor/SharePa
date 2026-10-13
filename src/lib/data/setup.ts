import type { SupabaseClient } from "@supabase/supabase-js";

export type PickupPoint = { id: string; name: string; address: string; lat?: number | null; lng?: number | null };

export type SetupEvent = {
  id: string;
  title: string;
  place: string | null;
  weekday: number;
  time: string; // HH:MM
  kind: "child" | "family" | "personal";
  hidden: boolean;
  category: string | null;
  activity: string | null;
  needsRide: boolean;
  childIds: string[];
};

export type SetupData = {
  me: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    homeLat: number | null;
    homeLng: number | null;
    emergencyName: string;
    emergencyPhone: string;
    pickupPoints: PickupPoint[];
    defaultPickup: string;
    inviteCode: string;
    isDemo: boolean;
  };
  events: SetupEvent[];
  children: { id: string; name: string; phone: string }[];
  friends: { id: string; name: string; labels: string[] }[];
  /** Done state of the 7 steps, in order. */
  checks: boolean[];
};

export const SETUP_STEPS = [
  { title: "Import calendar", lead: "Bring in your family’s activities. We only read titles, times and places." },
  { title: "Set up SharePa events", lead: "Choose which calendar events SharePa should use." },
  { title: "Categorize events", lead: "Click a kids’ event and choose its category and activity, e.g. Sport · Soccer." },
  { title: "Complete profile", lead: "Parents you ride with see these details. Your emergency contact is shown only to drivers." },
  { title: "Add children", lead: "Add the kids you organize rides for." },
  { title: "Add friends", lead: "Search parents already on SharePa, or invite new ones." },
  {
    title: "Label friends",
    lead: "Add the activities you share with each friend from your calendar, or your own labels like Class 3B. A friend can have several labels.",
  },
];

export function setupChecks(d: Omit<SetupData, "checks">): boolean[] {
  const visible = d.events.filter((e) => !e.hidden);
  return [
    d.events.length > 0,
    visible.length > 0,
    visible.length > 0 && visible.every((e) => e.category || !e.needsRide),
    !!(d.me.phone && d.me.address && d.me.emergencyName && d.me.emergencyPhone),
    d.children.length > 0,
    d.friends.length > 0,
    d.friends.length > 0 && d.friends.every((f) => f.labels.length > 0),
  ];
}

/** Everything the set-up steps need, read with the parent's own permissions. */
export async function loadSetup(supabase: SupabaseClient, userId: string, email: string): Promise<SetupData> {
  const [profileRes, eventsRes, childrenRes, friendsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, phone, address, home_lat, home_lng, emergency_name, emergency_phone, pickup_points, default_pickup, invite_code, is_demo")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("events")
      .select("id, title, place, weekday, start_time, kind, hidden, category, activity, needs_ride, event_children(child_id)")
      .eq("owner_id", userId)
      .order("start_time"),
    supabase.from("children").select("id, name, phone").eq("parent_id", userId).order("created_at"),
    supabase.from("friendships").select("labels, friend:profiles!friendships_friend_id_fkey(id, full_name)").eq("user_id", userId),
  ]);

  const p = profileRes.data;
  const data: Omit<SetupData, "checks"> = {
    me: {
      id: userId,
      name: p?.full_name ?? "",
      email,
      phone: p?.phone ?? "",
      address: p?.address ?? "",
      homeLat: p?.home_lat ?? null,
      homeLng: p?.home_lng ?? null,
      emergencyName: p?.emergency_name ?? "",
      emergencyPhone: p?.emergency_phone ?? "",
      pickupPoints: Array.isArray(p?.pickup_points) ? (p.pickup_points as PickupPoint[]) : [],
      defaultPickup: p?.default_pickup ?? "home",
      inviteCode: p?.invite_code ?? "",
      isDemo: !!p?.is_demo,
    },
    events: (eventsRes.data ?? []).map((e) => ({
      id: e.id,
      title: e.title,
      place: e.place,
      weekday: e.weekday,
      time: String(e.start_time).slice(0, 5),
      kind: e.kind,
      hidden: e.hidden,
      category: e.category,
      activity: e.activity,
      needsRide: e.needs_ride,
      childIds: (e.event_children ?? []).map((c: { child_id: string }) => c.child_id),
    })),
    children: (childrenRes.data ?? []).map((c) => ({ id: c.id, name: c.name, phone: c.phone ?? "" })),
    friends: (friendsRes.data ?? [])
      .map((f) => {
        const fr = f.friend as unknown as { id: string; full_name: string } | null;
        return fr ? { id: fr.id, name: fr.full_name, labels: f.labels ?? [] } : null;
      })
      .filter((f): f is { id: string; name: string; labels: string[] } => !!f)
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
  return { ...data, checks: setupChecks(data) };
}
