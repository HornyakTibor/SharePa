"use client";

import { useEffect, useState, useTransition } from "react";
import type { SetupResult } from "@/app/app/setup/actions";
import { WEEKDAYS } from "@/lib/dates";

export { btn, cx, inputCls } from "./styles";
import { cx } from "./styles";

export function Label({ text, children, className = "" }: { text: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cx("flex min-w-0 flex-col gap-2 text-sm font-semibold text-ink-2", className)}>
      {text}
      {children}
    </label>
  );
}

/** Soft purple note at the top of a step. */
export function Note({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-p100/60 px-4 py-3 text-sm text-ink-2 [&_b]:text-navy">{children}</div>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="m-0 rounded-2xl bg-canvas px-4 py-8 text-center text-sm text-ink-3">{children}</p>;
}

/** Runs a server action with a busy state and shows its message as a toast. */
export function useSetupAction() {
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);
  const run = (fn: () => Promise<SetupResult>, after?: (r: SetupResult) => void) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) setToast({ text: r.error, error: true });
      else if (r.message) setToast({ text: r.message, error: false });
      after?.(r);
    });
  const node = toast ? (
    <div
      role={toast.error ? "alert" : "status"}
      className={cx(
        "fixed bottom-6 left-1/2 z-[60] max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-full px-5 py-3 text-sm font-semibold shadow-[0_12px_32px_rgba(9,16,29,.24)]",
        toast.error ? "bg-err text-white" : "bg-p700 text-white",
      )}
    >
      {toast.text}
    </div>
  ) : null;
  return { pending, run, toast: node, say: (text: string, error = false) => setToast({ text, error }) };
}

/** The 7 weekday columns used by the event pickers (scrolls sideways on phones). */
export function WeekGrid<T extends { id: string; weekday: number; time: string }>({
  events,
  dates,
  render,
}: {
  events: T[];
  dates: string[]; // next date of each weekday, Mon…Sun, "12 Oct"
  render: (e: T) => React.ReactNode;
}) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-2">
      <div className="grid min-w-[760px] grid-cols-7 gap-2">
        {WEEKDAYS.map((d, k) => {
          const list = events.filter((e) => e.weekday === k).sort((a, b) => a.time.localeCompare(b.time));
          return (
            <div key={d} className="flex min-w-0 flex-col gap-2 rounded-2xl bg-canvas p-2">
              <div className="flex items-baseline justify-between px-1 text-xs font-bold uppercase tracking-[.06em] text-ink-3">
                <span>{d}</span>
                <span className="font-semibold normal-case tracking-normal">{dates[k]}</span>
              </div>
              {list.length ? list.map((e) => <div key={e.id}>{render(e)}</div>) : <span className="px-1 py-2 text-xs text-ink-3">No events</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
