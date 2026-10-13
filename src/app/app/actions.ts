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

  // The parent's own ride offer follows the choice.
  const { data: mine } = await supabase
    .from("rides")
    .select("id")
    .eq("event_id", eventId)
    .eq("ride_date", date)
    .eq("driver_id", uid)
    .limit(1)
    .maybeSingle();

  if (mode === "drive") {
    const ride = { seats, pickup, pickup_time: pickupTime, status: "offered" as const };
    const { error } = mine
      ? await supabase.from("rides").update(ride).eq("id", mine.id)
      : await supabase.from("rides").insert({ ...ride, event_id: eventId, ride_date: date, driver_id: uid });
    if (error) return { ok: false, error: "Your ride offer couldn't be saved. Please try again." };
  } else if (mine) {
    await supabase.from("rides").update({ status: "cancelled" }).eq("id", mine.id);
  }

  revalidatePath("/app");
  if (mode === "none") return { ok: true, message: "Marked: no ride needed" };
  const sent = notifiedIds.length ? `Note sent to ${plural(notifiedIds.length, "parent")}` : "Saved";
  return { ok: true, message: mode === "drive" ? `${sent} · you're driving with ${plural(seats, "free seat")}` : `${sent} · ride requested` };
}
