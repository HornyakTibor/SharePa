import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadHome } from "@/lib/data/home";
import { longDate } from "@/lib/dates";
import { AppHeader } from "@/components/app/AppHeader";
import { WeekCalendar } from "@/components/app/WeekCalendar";
import { RidesCard } from "@/components/app/RidesCard";
import { Panels } from "@/components/app/Panels";
import { HomeViews } from "@/components/app/HomeViews";

// Always render per request: the page depends on who is logged in.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Home – SharePa" };

export default async function AppHome({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const supabase = await createClient();
  const { data: auth } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!supabase || !auth.user) redirect("/login?next=/app");

  const data = await loadHome(supabase, auth.user.id);
  const first = data.me.name.split(" ")[0];

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader name={data.me.name} />
      <main className="mx-auto flex max-w-[1232px] flex-col gap-6 px-4 pt-8 pb-24 sm:px-8">
        {data.me.isDemo && (
          <div role="note" className="flex flex-wrap items-center gap-3 rounded-[20px] bg-[linear-gradient(95deg,#150830_0%,#341C67_50%,#5833A7_100%)] px-5 py-4 text-white">
            <span className="rounded-full bg-yellow px-2.5 py-1 text-xs font-bold text-p700">Demo</span>
            <p className="m-0 grow text-sm">
              You&apos;re exploring SharePa as <b>{data.me.name}</b>, a sample parent. Everything resets every night, so feel free to click around.
            </p>
          </div>
        )}
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-[.08em] text-ink-3">{longDate(data.today)}</p>
          <h1 className="mt-1 mb-0 text-[31px] font-semibold text-navy">Hi {first}</h1>
        </div>
        {data.week.some((d) => d.items.length) ? (
          <HomeViews
            initial={view === "list" ? "list" : "cal"}
            calendar={<WeekCalendar data={data} />}
            list={<RidesCard data={data} />}
          />
        ) : (
          <WeekCalendar data={data} />
        )}
        <Panels data={data} />
      </main>
    </div>
  );
}
