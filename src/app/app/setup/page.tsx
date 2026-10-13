import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadSetup, SETUP_STEPS } from "@/lib/data/setup";
import { loadHome } from "@/lib/data/home";
import { addDays, shortDate, today, weekday } from "@/lib/dates";
import { AppHeader } from "@/components/app/AppHeader";
import { btn, cx } from "@/components/setup/styles";
import { finishSetup } from "./actions";
import { StepImport } from "@/components/setup/StepImport";
import { StepSelect } from "@/components/setup/StepSelect";
import { StepCategorize } from "@/components/setup/StepCategorize";
import { StepProfile } from "@/components/setup/StepProfile";
import { StepChildren } from "@/components/setup/StepChildren";
import { StepFriends } from "@/components/setup/StepFriends";
import { StepLabels } from "@/components/setup/StepLabels";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Set up SharePa" };

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ step?: string; from?: string }> }) {
  const { step: raw, from } = await searchParams;
  const fromProfile = from === "profile"; // opened from the Profile page to edit one thing
  const supabase = await createClient();
  const { data: auth } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!supabase || !auth.user) redirect("/login?next=/app/setup");

  const [data, home] = await Promise.all([loadSetup(supabase, auth.user.id, auth.user.email ?? ""), loadHome(supabase, auth.user.id)]);
  const step = Math.min(Math.max(parseInt(raw ?? "1", 10) || 1, 1), SETUP_STEPS.length); // 1-based in the URL
  const i = step - 1;
  const last = step === SETUP_STEPS.length;
  const doneCount = data.checks.filter(Boolean).length;

  const now = today();
  const dates = DAY_NAMES.map((_, k) => shortDate(addDays(now, (k - weekday(now) + 7) % 7)));
  const dayOptions = Array.from({ length: 14 }, (_, k) => {
    const d = addDays(now, k);
    return { weekday: weekday(d), label: `${DAY_NAMES[weekday(d)]} (${shortDate(d)})` };
  });
  const visible = data.events.filter((e) => !e.hidden);
  const href = (s: number) => `/app/setup?step=${s}${fromProfile ? "&from=profile" : ""}`;

  let body: React.ReactNode;
  if (i === 0) body = <StepImport events={data.events} dayOptions={dayOptions} today={now} rangeEnd={addDays(now, 13)} />;
  else if (i === 1)
    body = data.events.length ? <StepSelect events={data.events} dates={dates} next={fromProfile ? "/app/profile" : undefined} /> : <NeedFirst text="Import your calendar first" to={1} label="Import calendar" />;
  else if (i === 2)
    body = visible.length ? (
      <StepCategorize events={visible} dates={dates} kids={data.children} />
    ) : (
      <NeedFirst text="No SharePa events yet" to={data.events.length ? 2 : 1} label={data.events.length ? "Choose events" : "Import calendar"} />
    );
  else if (i === 3) body = <StepProfile me={data.me} next={fromProfile ? "/app/profile" : undefined} />;
  else if (i === 4) body = <StepChildren kids={data.children} address={data.me.address} />;
  else if (i === 5) body = <StepFriends friendCount={data.friends.length} inviteCode={data.me.inviteCode} isDemo={data.me.isDemo} firstName={data.me.name.split(" ")[0]} />;
  else body = data.friends.length ? <StepLabels friends={data.friends} events={data.events} /> : <NeedFirst text="No friends to label yet" to={6} label="Add friends" />;

  // The main button: submits the step's form where there is one, otherwise moves on.
  const submits = (i === 1 && data.events.length > 0) || i === 3;
  const primaryLabel = fromProfile ? (submits ? "Save and back to Profile" : "Back to Profile") : last ? "Go to dashboard" : i === 1 && data.events.length ? "Apply for SharePa" : "Continue";

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader name={data.me.name} notifications={home.notifications} />
      <main className="mx-auto grid max-w-[1232px] items-start gap-6 px-4 pt-8 pb-24 sm:px-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside aria-label="Set-up steps" className="rounded-[24px] bg-white p-5 shadow-[0_4px_16px_rgba(10,15,28,.06)] lg:sticky lg:top-24">
          <p className="m-0 text-xs font-semibold uppercase tracking-[.08em] text-ink-3">Get started</p>
          <h2 className="mt-1 mb-4 text-xl font-bold text-navy">Set up SharePa</h2>
          <div className="h-2 overflow-hidden rounded-full bg-p100" aria-hidden="true">
            <div className="h-full rounded-full bg-[linear-gradient(95deg,#150830_0%,#341C67_50%,#5833A7_100%)]" style={{ width: `${Math.round((doneCount / SETUP_STEPS.length) * 100)}%` }} />
          </div>
          <p className="mt-2 mb-4 text-sm text-ink-3">{doneCount} of {SETUP_STEPS.length} done</p>
          <ol className="m-0 flex list-none gap-1 overflow-x-auto p-0 pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {SETUP_STEPS.map((s, k) => {
              const on = k === i;
              const ok = data.checks[k];
              return (
                <li key={s.title} className="shrink-0">
                  <Link
                    href={href(k + 1)}
                    aria-current={on ? "step" : undefined}
                    className={cx(
                      "flex items-center gap-3 rounded-2xl px-3 py-2 text-[15px] font-semibold whitespace-nowrap no-underline transition-colors",
                      on ? "bg-p100 text-navy" : "text-ink-3 hover:bg-canvas hover:text-ink",
                    )}
                  >
                    <span
                      className={cx(
                        "grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full text-[13px] font-bold",
                        ok ? "bg-ok text-white" : on ? "bg-white text-p600 shadow-[inset_0_0_0_2px_#5833A7]" : "bg-white text-ink-3 shadow-[inset_0_0_0_2px_#e3e5e8]",
                      )}
                    >
                      {ok ? "✓" : k + 1}
                    </span>
                    {s.title}
                    <span className="sr-only">{ok ? " (done)" : ""}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </aside>

        <section className="min-w-0 rounded-[28px] bg-white p-6 shadow-[0_4px_16px_rgba(10,15,28,.06)] sm:p-8">
          <p className="m-0 text-xs font-semibold uppercase tracking-[.08em] text-ink-3">Step {step} of {SETUP_STEPS.length}</p>
          <h1 className="mt-1 mb-2 text-[31px] font-semibold text-navy">{SETUP_STEPS[i].title}</h1>
          <p className="mt-0 mb-6 max-w-[64ch] text-base text-ink-2">{SETUP_STEPS[i].lead}</p>
          {body}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-5">
            {i > 0 ? (
              <Link href={href(step - 1)} className={cx(btn.base, btn.ghost)}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z" /></svg>
                Back
              </Link>
            ) : (
              <span />
            )}
            {fromProfile ? (
              <div className="flex flex-wrap gap-2">
                {submits && <Link href="/app/profile" className={cx(btn.base, btn.ghost)}>Cancel</Link>}
                {submits ? (
                  <button form="step-form" className={cx(btn.base, btn.pri)}>{primaryLabel}</button>
                ) : (
                  <Link href="/app/profile" className={cx(btn.base, btn.pri)}>{primaryLabel}</Link>
                )}
              </div>
            ) : (
            <div className="flex flex-wrap gap-2">
              {last ? (
                <form action={finishSetup}><button className={cx(btn.base, btn.ghost)}>Skip and finish</button></form>
              ) : (
                <Link href={href(step + 1)} className={cx(btn.base, btn.ghost)}>Skip for now</Link>
              )}
              {last ? (
                <form action={finishSetup}><button className={cx(btn.base, btn.pri)}>{primaryLabel}</button></form>
              ) : submits ? (
                <button form="step-form" className={cx(btn.base, btn.pri)}>{primaryLabel}</button>
              ) : (
                <Link href={href(step + 1)} className={cx(btn.base, btn.pri)}>{primaryLabel}</Link>
              )}
            </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function NeedFirst({ text, to, label }: { text: string; to: number; label: string }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="m-0 w-full rounded-2xl bg-canvas px-4 py-10 text-center text-sm text-ink-3">{text}</p>
      <Link href={`/app/setup?step=${to}`} className={cx(btn.base, btn.sec, btn.sm)}>{label}</Link>
    </div>
  );
}
