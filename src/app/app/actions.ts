"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { today } from "@/lib/dates";

export type RideChoiceInput = {
  eventId: string;
  date: string; // YYYY-MM-DD
  mode: "join" | "drive" | "none";
  childIds?: string[];
  notifiedIds?: string[];
  note?: string;
  seats?: number;
  pickup?: string;
  pickupTime?: string; // HH:MM
  pickupLat?: number | null;
  pickupLng?: number | null;
};

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * Saves what the parent wants for one event occurrence.
 * Everything is checked here on the server; the database rules check it again.
 */
export async function saveRideChoice(input: RideChoiceInput): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "SharePa isn't connected to its database right now." };
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return { ok: false, error: "Please log in again." };

  const { eventId, date, mode } = input;
  if (!UUID.test(eventId) || !DATE.test(date) || !["join", "drive", "none"].includes(mode)) {
    return { ok: false, error: "Something went wrong. Please reload the page and try again." };
  }
  if (date < today()) return { ok: false, error: "This event is already over." };

  const { data: event } = await supabase.from("events").select("id, owner_id, weekday").eq("id", eventId).maybeSingle();
  if (!event || event.owner_id !== uid) return { ok: false, error: "We couldn't find this event in your calendar." };

  // Only the parent's own children and friends may be used.
  const [kidsRes, friendsRes] = await Promise.all([
    supabase.from("children").select("id").eq("parent_id", uid),
    supabase.from("friendships").select("friend_id").eq("user_id", uid),
  ]);
  const myKids = new Set((kidsRes.data ?? []).map((k) => k.id));
  const myFriends = new Set((friendsRes.data ?? []).map((f) => f.friend_id));
  const childIds = [...new Set(input.childIds ?? [])].filter((id) => myKids.has(id));
  const notifiedIds = [...new Set(input.notifiedIds ?? [])].filter((id) => myFriends.has(id));
  const note = (input.note ?? "").trim().slice(0, 1000) || null;

  if (mode === "join" && childIds.length === 0) return { ok: false, error: "Pick at least one child who needs a ride." };

  let seats = 0;
  let pickup = "";
  let pickupTime = "";
  if (mode === "drive") {
    seats = Math.round(Number(input.seats));
    pickup = (input.pickup ?? "").trim().slice(0, 200);
    pickupTime = input.pickupTime ?? "";
    if (!(seats >= 1 && seats <= 8)) return { ok: false, error: "Choose how many free seats you have." };
    if (!pickup) return { ok: false, error: "Tell parents where you'll pick the kids up." };
    if (!TIME.test(pickupTime)) return { ok: false, error: "Enter a pick-up time, like 16:00." };
  }
  // Map point of the pick-up, if the parent chose one (the database fills "My home" itself).
  const lat = Number(input.pickupLat);
  const lng = Number(input.pickupLng);
  const pinned = input.pickupLat != null && input.pickupLng != null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

  // The parent's own ride offer follows the choice. It is saved first, so the note friends get includes it.
  const { data: mine } = await supabase
    .from("rides")
    .select("id")
    .eq("event_id", eventId)
    .eq("ride_date", date)
    .eq("driver_id", uid)
    .limit(1)
    .maybeSingle();

  if (mode === "drive") {
    const ride = {
      seats,
      pickup,
      pickup_time: pickupTime,
      pickup_lat: pinned ? lat : null,
      pickup_lng: pinned ? lng : null,
      status: "offered" as const,
    };
    const { error } = mine
      ? await supabase.from("rides").update(ride).eq("id", mine.id)
      : await supabase.from("rides").insert({ ...ride, event_id: eventId, ride_date: date, driver_id: uid });
    if (error) return { ok: false, error: "Your ride offer couldn't be saved. Please try again." };
  } else if (mine) {
    await supabase.from("rides").update({ status: "cancelled" }).eq("id", mine.id);
  }

  const { error: choiceError } = await supabase.from("ride_choices").upsert(
    {
      event_id: eventId,
      ride_date: date,
      parent_id: uid,
      mode,
      child_ids: mode === "join" ? childIds : [],
      notified_ids: mode === "none" ? [] : notifiedIds,
      note: mode === "none" ? null : note,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "event_id,ride_date,parent_id" },
  );
  if (choiceError) return { ok: false, error: "Your choice couldn't be saved. Please try again." };

  revalidatePath("/app");
  if (mode === "none") return { ok: true, message: "Marked: no ride needed" };
  const sent = notifiedIds.length ? `Note sent to ${plural(notifiedIds.length, "parent")}` : "Saved";
  return { ok: true, message: mode === "drive" ? `${sent} · you're driving with ${plural(seats, "free seat")}` : `${sent} · ride requested` };
}

async function session() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ? { supabase, uid: data.user.id } : null;
}

/** The event owner approves one driving offer. The database confirms it and tells everyone involved. */
export async function acceptOffer(rideId: string): Promise<ActionResult> {
  if (!UUID.test(rideId)) return { ok: false, error: "Something went wrong. Please reload the page." };
  const s = await session();
  if (!s) return { ok: false, error: "Please log in again." };
  const { data, error } = await s.supabase.rpc("accept_ride_offer", { p_ride: rideId });
  if (error) return { ok: false, error: error.message.includes("no longer open") ? "This offer is no longer open." : "The offer couldn't be approved. Please try again." };
  revalidatePath("/app");
  return { ok: true, message: `Ride approved · ${String(data).split(" ")[0]} will drive` };
}

/** "I can drive": a friend answers a ride request from their notifications. */
export async function offerFromRequest(notificationId: string): Promise<ActionResult> {
  if (!UUID.test(notificationId)) return { ok: false, error: "Something went wrong. Please reload the page." };
  const s = await session();
  if (!s) return { ok: false, error: "Please log in again." };

  const { data: n } = await s.supabase
    .from("notifications")
    .select("kind, event_id, ride_date, actor_id")
    .eq("id", notificationId)
    .maybeSingle();
  if (!n || n.kind !== "request" || !n.event_id || !n.ride_date) return { ok: false, error: "This request is no longer available." };
  if (n.ride_date < today()) return { ok: false, error: "This event is already over." };

  const [{ data: ev }, { data: req }, { data: asker }] = await Promise.all([
    s.supabase.from("events").select("start_time").eq("id", n.event_id).maybeSingle(),
    s.supabase.from("ride_choices").select("child_ids").eq("event_id", n.event_id).eq("ride_date", n.ride_date).eq("parent_id", n.actor_id).maybeSingle(),
    s.supabase.from("profiles").select("home_lat, home_lng").eq("id", n.actor_id).maybeSingle(),
  ]);
  if (!ev) return { ok: false, error: "This request is no longer available." };

  const [h, m] = String(ev.start_time).split(":").map(Number);
  const t = (h * 60 + m - 30 + 1440) % 1440;
  const pickupTime = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  const seats = Math.max(1, Math.min(8, req?.child_ids?.length ?? 1));

  const { error } = await s.supabase.from("rides").upsert(
    { event_id: n.event_id, ride_date: n.ride_date, driver_id: s.uid, seats, pickup: "At your home", pickup_time: pickupTime, pickup_lat: asker?.home_lat ?? null, pickup_lng: asker?.home_lng ?? null, status: "offered" },
    { onConflict: "event_id,ride_date,driver_id" },
  );
  if (error) return { ok: false, error: "Your offer couldn't be sent. Please try again." };
  revalidatePath("/app");
  return { ok: true, message: "Offer sent · they'll see it right away" };
}

/** Marks every notification as read when the parent opens the bell. */
export async function markNotificationsRead(): Promise<void> {
  const s = await session();
  if (!s) return;
  await s.supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("recipient_id", s.uid).is("read_at", null);
  revalidatePath("/app");
}
