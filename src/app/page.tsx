export const dynamic = "force-dynamic";

type DbStatus = "connected" | "error" | "not-configured";

async function checkDatabase(): Promise<DbStatus> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return "not-configured";
  try {
    // A real round trip to the Supabase project, authenticated with the publishable key.
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    return res.ok ? "connected" : "error";
  } catch {
    return "error";
  }
}

const STATUS = {
  connected: { label: "Database connected", cls: "bg-ok-bg text-ok", dot: "bg-ok" },
  error: { label: "Database not reachable", cls: "bg-err-bg text-err", dot: "bg-err" },
  "not-configured": { label: "Database keys missing", cls: "bg-white text-ink-3", dot: "bg-ink-3" },
} as const;

function CarMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M18.92 6.01A1.5 1.5 0 0 0 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-8l-2.08-5.99zM6.5 16a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm11 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM5 11l1.5-4.5h11L19 11H5z" />
    </svg>
  );
}

export default async function Home() {
  const status = STATUS[await checkDatabase()];

  return (
    <main className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-p500 text-white shadow-[inset_0_-3px_0_rgba(0,0,0,.18)]">
            <CarMark />
          </span>
          <span className="text-[22px] font-bold tracking-tight text-navy">
            Share<span className="text-p500">Pa</span>
          </span>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-16">
        <div className="w-full rounded-[28px] bg-white p-8 shadow-[0_12px_40px_rgba(9,16,29,.08)] sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-[.08em] text-ink-3">Coming soon</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight text-navy sm:text-5xl">
            Share the school run with parents you trust
          </h1>
          <p className="mt-4 max-w-xl text-ink-2">
            SharePa reads your family calendar, finds the parents going to the same practice or lesson,
            and lets you offer or join a ride in a few taps.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[linear-gradient(95deg,#150830,#341c67,#5833a7)] px-5 py-3 font-semibold text-white">
              Demo opening soon
            </span>
            <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${status.cls}`}>
              <span className={`h-2 w-2 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>

          <ul className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ["Calendar import", "Your kids' activities appear on their own."],
              ["One car, many kids", "Offer free seats to friends at the same event."],
              ["Only people you trust", "Invite-only circles of parents."],
            ].map(([title, text]) => (
              <li key={title} className="rounded-2xl bg-canvas p-4">
                <p className="font-semibold text-navy">{title}</p>
                <p className="mt-1 text-sm text-ink-3">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="pb-8 text-center text-xs text-ink-3">
        A portfolio project by Tibor Hornyák · built with Claude Code
      </footer>
    </main>
  );
}
