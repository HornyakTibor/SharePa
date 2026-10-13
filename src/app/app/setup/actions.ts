"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { guessKind, suggestCategory } from "@/lib/taxonomy";
import { formatHu } from "@/lib/phone";
import { SAMPLE_CALENDAR } from "@/lib/sampleCalendar";
import type { PickupPoint } from "@/lib/data/setup";

export type SetupResult = { ok: true; message?: string } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const clean = (v: unknown, max = 160) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, max);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

async function session() {
  const supabase = await createClient();
  if (!supabase) return { error: "SharePa isn't connected to its database right now." } as const;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Please log in again." } as const;
  return { supabase, uid: data.user.id } as const;
}

const done = (message?: string): SetupResult => {
  revalidatePath("/app", "layout");
  return { ok: true, message };
};

// ---------- step 1: calendar ----------

type NewEvent = { title: string; place: string; weekday: number; time: string; kind?: "child" | "family" | "personal" };

async function insertEvents(list: NewEvent[], source: "manual" | "ics" | "sample", hidden: boolean): Promise<SetupResult> {
  const s = await session();
  if ("error" in s) return { ok: false, error: s.error! };
  const rows = list
    .map((e) => ({
      owner_id: s.uid,
      title: clean(e.title, 120),
      place: clean(e.place) || null,
      weekday: Number(e.weekday),
      start_time: e.time,
      kind: e.kind ?? guessKind(e.title),
      source,
      hidden,
    }))
    .filter((e) => e.title && Number.isInteger(e.weekday) && e.weekday >= 0 && e.weekday <= 6 && TIME.test(e.start_time));
  if (!rows.length) return { ok: false, error: "We couldn't find any events with a title, day and time." };

  // Skip events the parent already has (same title, day and time).
  const { data: existing } = await s.supabase.from("events").select("title, weekday, start_time").eq("owner_id", s.uid);
  const have = new Set((existing ?? []).map((e) => `${e.title.toLowerCase()}|${e.weekday}|${String(e.start_time).slice(0, 5)}`));
  const fresh = rows.filter((r) => !have.has(`${r.title.toLowerCase()}|${r.weekday}|${r.start_time}`)).slice(0, 60);
  if (!fresh.length) return { ok: true, message: "These events are already in SharePa." };

  const { error } = await s.supabase.from("events").insert(fresh);
  if (error) return { ok: false, error: "We couldn't save the events. Please try again." };
  return done(`${plural(fresh.length, "event")} added.`);
}

export async function addEvent(input: NewEvent): Promise<SetupResult> {
  if (!clean(input.title)) return { ok: false, error: "Please give the event a name." };
  if (!TIME.test(input.time)) return { ok: false, error: "Please choose a time." };
  return insertEvents([{ ...input, kind: input.kind ?? "child" }], "manual", false);
}

export async function importEvents(list: NewEvent[]): Promise<SetupResult> {
  if (!Array.isArray(list) || !list.length) return { ok: false, error: "This file has no events we can use." };
  return insertEvents(list.slice(0, 60), "ics", true);
}

export async function importSampleCalendar(): Promise<SetupResult> {
  return insertEvents(SAMPLE_CALENDAR, "sample", true);
}

export async function removeEvent(eventId: string): Promise<SetupResult> {
  const s = await session();
  if ("error" in s) return { ok: false, error: s.error! };
  if (!UUID.test(eventId)) return { ok: false, error: "Something went wrong." };
  const { error } = await s.supabase.from("events").delete().eq("id", eventId).eq("owner_id", s.uid);
  if (error) return { ok: false, error: "We couldn't remove the event." };
  return done("Event removed.");
}

// ---------- step 2: which events SharePa uses ----------

export async function applyEventSelection(formData: FormData) {
  const s = await session();
  if ("error" in s) redirect("/login?next=/app/setup");
  const chosen = new Set(String(formData.get("selected") ?? "").split(",").filter((id) => UUID.test(id)));
  const { data: events } = await s.supabase.from("events").select("id, hidden").eq("owner_id", s.uid);
  const show = (events ?? []).filter((e) => chosen.has(e.id) && e.hidden).map((e) => e.id);
  const hide = (events ?? []).filter((e) => !chosen.has(e.id) && !e.hidden).map((e) => e.id);
  if (show.length) await s.supabase.from("events").update({ hidden: false }).in("id", show).eq("owner_id", s.uid);
  if (hide.length) await s.supabase.from("events").update({ hidden: true }).in("id", hide).eq("owner_id", s.uid);
  revalidatePath("/app", "layout");
  redirect("/app/setup?step=3");
}

// ---------- step 3: categories ----------

export async function setEventCategory(input: {
  eventId: string;
  category: string | null; // null = no ride needed
  activity?: string | null;
  childIds?: string[];
}): Promise<SetupResult> {
  const s = await session();
  if ("error" in s) return { ok: false, error: s.error! };
  if (!UUID.test(input.eventId)) return { ok: false, error: "Something went wrong." };
  const { data: ev } = await s.supabase.from("events").select("id").eq("id", input.eventId).eq("owner_id", s.uid).maybeSingle();
  if (!ev) return { ok: false, error: "We couldn't find this event." };

  const category = input.category ? clean(input.category, 40) : null;
  const activity = category && input.activity ? clean(input.activity, 40) || null : null;
  const { error } = await s.supabase
    .from("events")
    .update(category ? { category, activity, needs_ride: true } : { category: null, activity: null, needs_ride: false })
    .eq("id", input.eventId);
  if (error) return { ok: false, error: "We couldn't save the category." };

  if (input.childIds) {
    const { data: kids } = await s.supabase.from("children").select("id").eq("parent_id", s.uid);
    const mine = new Set((kids ?? []).map((k) => k.id));
    const ids = [...new Set(input.childIds)].filter((id) => mine.has(id));
    await s.supabase.from("event_children").delete().eq("event_id", input.eventId);
    if (ids.length) await s.supabase.from("event_children").insert(ids.map((child_id) => ({ event_id: input.eventId, child_id })));
  }
  return done(category ? `Category set: ${[category, activity].filter(Boolean).join(" · ")}` : "Marked as no ride needed.");
}

export async function applyAllSuggestions(): Promise<SetupResult> {
  const s = await session();
  if ("error" in s) return { ok: false, error: s.error! };
  const { data: events } = await s.supabase
    .from("events")
    .select("id, title, category, needs_ride")
    .eq("owner_id", s.uid)
    .eq("hidden", false);
  let n = 0;
  for (const e of events ?? []) {
    if (e.category || !e.needs_ride) continue;
    const sg = suggestCategory(e.title);
    if (!sg) continue;
    await s.supabase.from("events").update({ category: sg.category, activity: sg.activity }).eq("id", e.id);
    n++;
  }
  return done(`${plural(n, "suggestion")} applied.`);
}

// ---------- step 4: profile ----------

export type ProfileState = { error?: string } | undefined;

export async function saveProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const s = await session();
  if ("error" in s) return { error: s.error };
  const name = clean(formData.get("name"), 80);
  if (!name) return { error: "Please enter your full name." };

  let points: PickupPoint[] = [];
  try {
    const raw = JSON.parse(String(formData.get("pickupPoints") ?? "[]"));
    if (Array.isArray(raw)) {
      points = raw
        .map((p) => ({ id: clean(p?.id, 40), name: clean(p?.name, 60), address: clean(p?.address) }))
        .filter((p) => /^[a-z0-9-]{4,40}$/i.test(p.id) && p.name && p.address)
        .slice(0, 10);
    }
  } catch {
    points = [];
  }
  const pick = clean(formData.get("defaultPickup"), 40);
  const defaultPickup = points.some((p) => p.id === pick) ? pick : "home";

  const { error } = await s.supabase
    .from("profiles")
    .update({
      full_name: name,
      phone: formatHu(String(formData.get("phone") ?? "")) || null,
      address: clean(formData.get("address")) || null,
      emergency_name: clean(formData.get("emergencyName"), 80) || null,
      emergency_phone: formatHu(String(formData.get("emergencyPhone") ?? "")) || null,
      pickup_points: points,
      default_pickup: defaultPickup,
    })
    .eq("id", s.uid);
  if (error) return { error: "We couldn't save your profile. Please try again." };
  revalidatePath("/app", "layout");
  redirect("/app/setup?step=5");
}

// ---------- step 5: children ----------

export async function saveChild(input: { id?: string; name: string; phone?: string }): Promise<SetupResult> {
  const s = await session();
  if ("error" in s) return { ok: false, error: s.error! };
  const name = clean(input.name, 60);
  if (!name) return { ok: false, error: "Please enter your child’s name." };
  const row = { name, phone: formatHu(input.phone ?? "") || null };
  if (input.id) {
    if (!UUID.test(input.id)) return { ok: false, error: "Something went wrong." };
    const { error } = await s.supabase.from("children").update(row).eq("id", input.id).eq("parent_id", s.uid);
    if (error) return { ok: false, error: "We couldn't save the changes." };
    return done(`${name} updated.`);
  }
  const { error } = await s.supabase.from("children").insert({ ...row, parent_id: s.uid });
  if (error) return { ok: false, error: "We couldn't add your child." };
  return done(`${name} added.`);
}

export async function removeChild(id: string): Promise<SetupResult> {
  const s = await session();
  if ("error" in s) return { ok: false, error: s.error! };
  if (!UUID.test(id)) return { ok: false, error: "Something went wrong." };
  const { error } = await s.supabase.from("children").delete().eq("id", id).eq("parent_id", s.uid);
  if (error) return { ok: false, error: "We couldn't remove your child." };
  return done("Child removed.");
}

// ---------- step 6: friends ----------

export async function searchParents(q: string): Promise<{ id: string; name: string; isFriend: boolean }[]> {
  const s = await session();
  if ("error" in s) return [];
  const query = clean(q, 80);
  if (query.length < 2) return [];
  const { data } = await s.supabase.rpc("search_parents", { q: query });
  return (data ?? []).map((p: { id: string; full_name: string; is_friend: boolean }) => ({ id: p.id, name: p.full_name, isFriend: p.is_friend }));
}

export async function addFriend(id: string): Promise<SetupResult> {
  const s = await session();
  if ("error" in s) return { ok: false, error: s.error! };
  if (!UUID.test(id)) return { ok: false, error: "Something went wrong." };
  const { error } = await s.supabase.rpc("add_friend", { other: id });
  if (error) return { ok: false, error: error.message || "We couldn't add this parent." };
  return done("Friend added. They got a notification.");
}

// ---------- step 7: labels ----------

export async function setFriendLabels(friendId: string, labels: string[]): Promise<SetupResult> {
  const s = await session();
  if ("error" in s) return { ok: false, error: s.error! };
  if (!UUID.test(friendId)) return { ok: false, error: "Something went wrong." };
  const list = [...new Set((labels ?? []).map((l) => clean(l, 60)).filter(Boolean))].slice(0, 20);
  const { error } = await s.supabase.from("friendships").update({ labels: list }).eq("user_id", s.uid).eq("friend_id", friendId);
  if (error) return { ok: false, error: "We couldn't save the labels." };
  return done();
}

// ---------- finish ----------

export async function finishSetup() {
  const s = await session();
  if ("error" in s) redirect("/login?next=/app");
  await s.supabase.from("profiles").update({ onboarded_at: new Date().toISOString() }).eq("id", s.uid);
  revalidatePath("/app", "layout");
  redirect("/app");
}
