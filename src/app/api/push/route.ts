import { NextResponse, type NextRequest } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

// Called by the database (pg_net) whenever a parent gets a notification. Sends it to their browsers.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Sub = { endpoint: string; p256dh: string; auth: string };
type Body = { title?: string; body?: string; url?: string; tag?: string | null; subscriptions?: Sub[] };

export async function POST(req: NextRequest) {
  const secret = process.env.PUSH_WEBHOOK_SECRET;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!secret || !publicKey || !privateKey) return NextResponse.json({ error: "push not configured" }, { status: 503 });
  if (req.headers.get("x-push-secret") !== secret) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const data = (await req.json().catch(() => null)) as Body | null;
  const subs = (data?.subscriptions ?? []).filter((s) => s?.endpoint?.startsWith("https://") && s.p256dh && s.auth).slice(0, 20);
  if (!data || !subs.length) return NextResponse.json({ sent: 0 });

  webpush.setVapidDetails("mailto:hello@sharepa.tiborhornyak.hu", publicKey, privateKey);
  const payload = JSON.stringify({
    title: String(data.title ?? "SharePa").slice(0, 120),
    body: String(data.body ?? "").slice(0, 300),
    url: typeof data.url === "string" && data.url.startsWith("/") ? data.url : "/app",
    tag: data.tag ?? undefined,
  });

  const gone: string[] = [];
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 6, urgency: "high" });
        sent++;
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) gone.push(s.endpoint);
      }
    }),
  );

  // Browsers that unsubscribed are switched off, so they aren't tried again.
  if (gone.length && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
    await sb.rpc("push_gone", { p_secret: secret, p_endpoints: gone });
  }
  return NextResponse.json({ sent, gone: gone.length });
}
