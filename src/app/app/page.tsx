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
import { SetupCard } from "@/components/app/SetupCard";
import { DemoBar } from "@/components/app/DemoBar";
import { Tour } from "@/components/app/Tour";
import { loadSetup } from "@/lib/data/setup";
import Link from "next/link";

// Always render per request: the page depends on who is logged in.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Home – SharePa" };

export default async function AppHome({ searchParams }: { searchParams: Promise<{ view?: string; offers?: string; cal?: string; d?: string }> }) {
  const { view, offers, cal, d } = await searchParams;
  const calMode = cal === "day" || cal === "month" ? cal : "week";
  const supabase = await createClient();
  const { data: auth } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!supabase || !auth.user) redirect("/login?next=/app");

  const [data, setup] = await Promise.all([loadHome(supabase, auth.user.id, { mode: calMode, anchor: d }), loadSetup(supabase, auth.user.id, auth.user.email ?? "")]);
  // New parents start with the set-up steps (they can skip any of them).
  if (!data.me.isDemo && !data.me.onboarded) redirect("/app/setup");
  const setupDone = setup.checks.every(Boolean);
  data.openOffers = offers;
  const first = data.me.name.split(" ")[0];

  const heading = (
    <div>
      <p className="m-0 text-xs font-semibold uppercase tracking-[.08em] text-ink-3">{longDate(data.today)}</p>
      <h1 className="mt-1 mb-0 text-[31px] font-semibold text-navy">Hi {first}</h1>
    </div>
  );
  const guide = setupDone ? (
    <Link href="/app/setup" data-tour="setup" className="rounded-full px-4 py-2 text-sm font-semibold text-p500 no-underline hover:bg-p100">
      Set-up guide
    </Link>
  ) : null;
  const setupCard = setupDone ? null : <div data-tour="setup"><SetupCard checks={setup.checks} /></div>;

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader name={data.me.name} notifications={data.notifications} />
      <main className="mx-auto flex max-w-[1232px] flex-col gap-6 px-4 pt-8 pb-24 sm:px-8">
        {data.me.isDemo && <DemoBar name={data.me.name} />}
        {data.week.some((d) => d.items.length) ? (
          <HomeViews
            initial={view === "list" && !cal ? "list" : "cal"}
            heading={heading}
            aside={guide}
            between={setupCard}
            calendar={<WeekCalendar data={data} />}
            list={<RidesCard data={data} />}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              {heading}
              {guide}
            </div>
            {setupCard}
            <WeekCalendar data={data} />
          </>
        )}
        <Panels data={data} />
        <Tour autoStart={data.me.isDemo} />
      </main>
    </div>
  );
}
