import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadSetup, SETUP_STEPS } from "@/lib/data/setup";
import { loadHome } from "@/lib/data/home";
import { WEEKDAYS } from "@/lib/dates";
import { categoryLabel, categoryStyle } from "@/lib/categories";
import { signOut } from "@/app/auth/actions";
import { AppHeader } from "@/components/app/AppHeader";
import { Avatar, Card, CardTitle, Icons } from "@/components/app/ui";
import { LeafletMap, type MapMarker } from "@/components/map/LeafletMap";
import { btn, cx } from "@/components/setup/styles";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profile – SharePa" };

const edit = (step: number) => `/app/setup?step=${step}&from=profile`;

function Row({ label, value, hint }: { label: string; value?: string | null; hint?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-t border-black/5 py-3 first:border-t-0">
      <span className="text-sm text-ink-3">{label}</span>
      <span className="min-w-0 text-right text-[15px] font-medium text-ink [overflow-wrap:anywhere]">
        {value ? value : <span className="font-normal text-ink-3">— not set</span>}
        {value && hint && <span className="block text-xs font-normal text-ok">{hint}</span>}
      </span>
    </div>
  );
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: auth } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!supabase || !auth.user) redirect("/login?next=/app/profile");

  const [data, home] = await Promise.all([loadSetup(supabase, auth.user.id, auth.user.email ?? ""), loadHome(supabase, auth.user.id)]);
  const { me } = data;
  const visible = data.events.filter((e) => !e.hidden).sort((a, b) => a.weekday - b.weekday || a.time.localeCompare(b.time));
  const hiddenCount = data.events.length - visible.length;
  const pick = me.pickupPoints.find((p) => p.id === me.defaultPickup);
  const done = data.checks.filter(Boolean).length;

  // "Your places" map: home, pick-up points and the places of SharePa events.
  const markers: MapMarker[] = [
    ...(me.homeLat != null && me.homeLng != null ? [{ lat: me.homeLat, lng: me.homeLng, tone: "start" as const, text: "H", label: `Home · ${me.address}` }] : []),
    ...me.pickupPoints.filter((p) => p.lat != null && p.lng != null).map((p) => ({ lat: p.lat!, lng: p.lng!, tone: "pin" as const, text: "P", label: `${p.name} · ${p.address}` })),
    ...visible
      .filter((e) => e.needsRide && e.placeLat != null && e.placeLng != null)
      .map((e) => ({ lat: e.placeLat!, lng: e.placeLng!, tone: "end" as const, text: "★", label: `${e.title}${e.place ? ` · ${e.place}` : ""}` })),
  ].filter((m, i, all) => all.findIndex((x) => x.lat === m.lat && x.lng === m.lng) === i);

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader name={me.name || "Parent"} notifications={home.notifications} active="profile" />
      <main className="mx-auto flex max-w-[1232px] flex-col gap-6 px-4 pt-8 pb-24 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="m-0 text-[31px] font-semibold text-navy">Profile</h1>
            <p className="mt-1 mb-0 max-w-[64ch] text-ink-2">Your details are shared with parents you ride with. Emergency contact is shown only to drivers.</p>
          </div>
          <Link href="/app" className={cx(btn.base, btn.ghost)}>← Back to Home</Link>
        </div>

        <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr))]">
          <Card label="My details">
            <div className="flex items-center gap-4">
              <Avatar name={me.name || "Parent"} size={56} />
              <div className="min-w-0">
                <h2 className="m-0 text-xl font-semibold text-navy">{me.name || "Your name"}</h2>
                <span className="text-sm text-ink-3">
                  Parent{me.isDemo && <span className="ml-2 rounded-full bg-yellow px-2 py-0.5 text-xs font-bold text-p700">Demo</span>}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <Row label="Mobile phone" value={me.phone} />
              <Row label="Home address" value={me.address} hint={me.homeLat != null ? "Pinned on the map" : undefined} />
              <Row label="Email" value={me.email} />
              <Row label="Emergency contact" value={[me.emergencyName, me.emergencyPhone].filter(Boolean).join(" · ")} />
              <Row label="Default pick-up point" value={pick ? `${pick.name} — ${pick.address}` : me.address ? "Home" : null} />
            </div>
            <Link href={edit(4)} className={cx(btn.base, btn.sec, "mt-3")}>Edit my details</Link>
          </Card>

          <Card label="My kids">
            <CardTitle icon={Icons.child} aside={<span className="text-sm text-ink-3">{data.children.length}</span>}>My kids</CardTitle>
            {data.children.length ? (
              <ul className="m-0 mt-3 list-none p-0">
                {data.children.map((k) => (
                  <li key={k.id} className="flex items-center gap-3 border-t border-black/5 py-3 first:border-t-0">
                    <Avatar name={k.name} />
                    <div className="flex min-w-0 flex-col">
                      <b className="text-ink">{k.name}</b>
                      <span className="truncate text-sm text-ink-3">{k.phone || "No phone"} · {me.address || "Home address"}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 mb-0 rounded-2xl bg-canvas px-4 py-6 text-center text-sm text-ink-3">No kids added yet.</p>
            )}
            <Link href={edit(5)} className={cx(btn.base, btn.pri, "mt-3")}>{data.children.length ? "Add or edit kids" : "+ Add kid"}</Link>
          </Card>

          <Card label="Friends">
            <CardTitle icon={Icons.group} aside={<span className="text-sm text-ink-3">{data.friends.length}</span>}>Friends</CardTitle>
            {data.friends.length ? (
              <ul className="m-0 mt-3 list-none p-0">
                {data.friends.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 border-t border-black/5 py-3 first:border-t-0">
                    <Avatar name={f.name} />
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="font-semibold text-ink">{f.name}</span>
                      <div className="flex flex-wrap gap-1">
                        {f.labels.length ? (
                          f.labels.map((l) => <span key={l} className="rounded-full bg-p100 px-2.5 py-0.5 text-xs font-semibold text-p600">{l.replace(" · ", " / ")}</span>)
                        ) : (
                          <span className="text-xs text-ink-3">no label</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 mb-0 rounded-2xl bg-canvas px-4 py-6 text-center text-sm text-ink-3">No friends yet. Search for parents you know or send an invite link.</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={edit(6)} className={cx(btn.base, btn.pri)}>Add or invite friends</Link>
              {data.friends.length > 0 && <Link href={edit(7)} className={cx(btn.base, btn.sec)}>Edit labels</Link>}
            </div>
          </Card>

          <Card label="Calendar">
            <CardTitle icon={Icons.calendar} aside={<span className="text-sm text-ink-3">{visible.length} a week</span>}>Calendar</CardTitle>
            {visible.length ? (
              <ul className="m-0 mt-3 list-none p-0">
                {visible.map((e) => {
                  const s = categoryStyle(e.category);
                  return (
                    <li key={e.id} className="flex items-center gap-3 border-t border-black/5 py-2.5 first:border-t-0">
                      <span className="w-[86px] shrink-0 font-mono text-[13px] text-ink-3">{WEEKDAYS[e.weekday]} · {e.time}</span>
                      <span className="min-w-0 grow truncate font-semibold text-ink">{e.title}</span>
                      {e.needsRide ? (
                        e.category ? (
                          <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: s.bg, color: s.fg }}>{categoryLabel(e.category, e.activity)}</span>
                        ) : (
                          <span className="shrink-0 text-xs text-ink-3">no category</span>
                        )
                      ) : (
                        <span className="shrink-0 text-xs text-ink-3">no ride needed</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 mb-0 rounded-2xl bg-canvas px-4 py-6 text-center text-sm text-ink-3">No events in SharePa yet.</p>
            )}
            {hiddenCount > 0 && <p className="mt-2 mb-0 text-xs text-ink-3">{hiddenCount} more imported event{hiddenCount === 1 ? " is" : "s are"} hidden from SharePa.</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={edit(1)} className={cx(btn.base, btn.pri)}>Import or add events</Link>
              {data.events.length > 0 && <Link href={edit(2)} className={cx(btn.base, btn.sec)}>Choose events</Link>}
              {visible.length > 0 && <Link href={edit(3)} className={cx(btn.base, btn.sec)}>Categories</Link>}
            </div>
          </Card>

          {markers.length > 0 && (
            <Card label="Your places">
              <CardTitle icon={<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>}>
                Your places
              </CardTitle>
              <LeafletMap className="mt-4 h-[260px] w-full" markers={markers} label="Map of your home, pick-up points and activities" />
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-3">
                <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-full bg-ok" />Home</span>
                {me.pickupPoints.length > 0 && <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-full bg-p700" />Pick-up points</span>}
                <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-full bg-p500" />Activities</span>
              </div>
            </Card>
          )}

          <Card label="Account">
            <CardTitle icon={Icons.tag}>Account</CardTitle>
            <div className="mt-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 py-3">
                <span className="text-sm text-ink-2">Set-up: <b className="text-navy">{done} of {SETUP_STEPS.length}</b> steps done</span>
                <Link href="/app/setup" className={cx(btn.base, btn.ghost, btn.sm)}>Set-up guide</Link>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 py-3">
                <span className="text-sm text-ink-2">Password</span>
                {me.isDemo ? (
                  <span className="text-xs text-ink-3">Can’t be changed on the demo account</span>
                ) : (
                  <Link href="/reset-password" className={cx(btn.base, btn.ghost, btn.sm)}>Change password</Link>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="text-sm text-ink-2">Signed in as {me.email}</span>
                <form action={signOut}>
                  <button className={cx(btn.base, btn.sec, btn.sm)}>Log out</button>
                </form>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
