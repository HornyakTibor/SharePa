import Link from "next/link";
import { SETUP_STEPS } from "@/lib/data/setup";

/** "Get set up" panel on Home: shows the set-up steps that were skipped. */
export function SetupCard({ checks }: { checks: boolean[] }) {
  const done = checks.filter(Boolean).length;
  const todo = SETUP_STEPS.map((s, k) => ({ ...s, k })).filter((s) => !checks[s.k]);
  if (!todo.length) return null;
  return (
    <section aria-labelledby="setup-title" className="flex flex-col gap-4 rounded-[28px] bg-white p-6 shadow-[0_4px_16px_rgba(10,15,28,.06)] sm:flex-row sm:items-center">
      <div className="flex min-w-0 grow flex-col gap-2">
        <p className="m-0 text-xs font-semibold uppercase tracking-[.08em] text-ink-3">Get set up · {done} of {SETUP_STEPS.length} done</p>
        <h2 id="setup-title" className="m-0 text-xl font-bold text-navy">Finish setting up SharePa</h2>
        <div className="h-2 max-w-[420px] overflow-hidden rounded-full bg-p100" aria-hidden="true">
          <div className="h-full rounded-full bg-[linear-gradient(95deg,#150830_0%,#341C67_50%,#5833A7_100%)]" style={{ width: `${Math.round((done / SETUP_STEPS.length) * 100)}%` }} />
        </div>
        <ul className="m-0 mt-1 flex list-none flex-wrap gap-2 p-0">
          {todo.map((s) => (
            <li key={s.title}>
              <Link href={`/app/setup?step=${s.k + 1}`} className="inline-flex rounded-full bg-canvas px-3 py-1.5 text-sm font-semibold text-p600 no-underline hover:bg-p100">
                {s.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <Link
        href={`/app/setup?step=${todo[0].k + 1}`}
        className="inline-flex min-h-11 shrink-0 items-center justify-center self-start rounded-full bg-p500 px-5 text-sm font-bold text-white no-underline shadow-[0_10px_24px_rgba(88,51,167,.24)] hover:bg-p600 sm:self-center"
      >
        Continue set-up
      </Link>
    </section>
  );
}
