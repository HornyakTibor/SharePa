import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Called once a day by Vercel Cron (see vercel.json). A small database read counts as
// activity, so the free Supabase project is never paused for inactivity.
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.json({ ok: false, reason: "not configured" }, { status: 500 });

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.from("profiles").select("id", { head: true, count: "exact" });
  return NextResponse.json({ ok: !error, at: new Date().toISOString() }, { status: error ? 502 : 200 });
}
