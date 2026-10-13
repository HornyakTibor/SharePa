"use client";

import { useState } from "react";
import { applyEventSelection } from "@/app/app/setup/actions";
import type { SetupEvent } from "@/lib/data/setup";
import { btn, cx, Note, WeekGrid } from "./ui";

const KIND = { child: "Kids", family: "Family", personal: "Personal" } as const;

/** Step 2: tick the events SharePa should use. The footer's "Apply for SharePa" submits this form. */
export function StepSelect({ events, dates }: { events: SetupEvent[]; dates: string[] }) {
  const [sel, setSel] = useState<Set<string>>(() => new Set(events.filter((e) => !e.hidden).map((e) => e.id)));
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <form id="step-form" action={applyEventSelection} className="flex flex-col gap-4">
      <input type="hidden" name="selected" value={[...sel].join(",")} />
      <Note>
        <b>Your calendar has personal, family and kids’ events.</b> Select only the ones you want to see in SharePa — usually your children’s activities that need a ride — and the rest stay hidden from you and other parents.
      </Note>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-ink-3"><b className="font-mono text-navy">{sel.size}</b> of {events.length} events selected</span>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={cx(btn.base, btn.ghost, btn.sm)} onClick={() => setSel(new Set([...sel, ...events.filter((e) => e.kind === "child").map((e) => e.id)]))}>
            Select all kids’ events
          </button>
          <button type="button" disabled={!sel.size} className={cx(btn.base, btn.ghost, btn.sm)} onClick={() => setSel(new Set())}>
            Clear selection
          </button>
        </div>
      </div>
      <WeekGrid
        events={events}
        dates={dates}
        render={(e) => {
          const on = sel.has(e.id);
          return (
            <button
              type="button"
              aria-pressed={on}
              onClick={() => toggle(e.id)}
              className={cx(
                "relative flex w-full cursor-pointer flex-col gap-1 rounded-xl border-0 p-2.5 text-left transition-shadow",
                on ? "bg-p100 shadow-[inset_0_0_0_2px_#5833A7]" : "bg-white shadow-[0_1px_2px_rgba(10,15,28,.06)] hover:shadow-[inset_0_0_0_2px_#b9a8ea]",
              )}
            >
              <span className="flex items-center justify-between gap-1">
                <span className="font-mono text-[12px] text-ink-3">{e.time}</span>
                <span className={cx("rounded-full px-1.5 py-px text-[10px] font-bold", on ? "bg-p500 text-white" : "bg-canvas text-ink-3")}>{KIND[e.kind]}</span>
              </span>
              <b className="text-[13px] leading-tight text-ink [overflow-wrap:anywhere]">{e.title}</b>
              {e.place && <span className="text-[11px] leading-tight text-ink-3 [overflow-wrap:anywhere]">{e.place}</span>}
            </button>
          );
        }}
      />
    </form>
  );
}
