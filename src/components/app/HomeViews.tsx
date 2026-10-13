"use client";

import { useRef, useState } from "react";

type View = "cal" | "list";

const CalendarIcon = (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
  </svg>
);
const ListIcon = (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
  </svg>
);

const TABS: { key: View; label: string; icon: React.ReactNode }[] = [
  { key: "cal", label: "Calendar view", icon: CalendarIcon },
  { key: "list", label: "List view", icon: ListIcon },
];

/**
 * Home page switch between the week calendar and the rides list, as in the prototype.
 * The choice is kept in the address (?view=list) so a reload or shared link keeps it.
 */
export function HomeViews({ initial, calendar, list }: { initial: View; calendar: React.ReactNode; list: React.ReactNode }) {
  const [view, setView] = useState<View>(initial);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (next: View, focus = false) => {
    setView(next);
    const url = new URL(window.location.href);
    if (next === "list") url.searchParams.set("view", "list");
    else url.searchParams.delete("view");
    window.history.replaceState(null, "", url);
    if (focus) refs.current[TABS.findIndex((t) => t.key === next)]?.focus();
  };

  // Arrow keys move between tabs, as screen-reader users expect from a tab list.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const i = TABS.findIndex((t) => t.key === view);
    const next = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
    select(next.key, true);
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div
        role="tablist"
        data-tour="views"
        aria-label="Home view"
        onKeyDown={onKeyDown}
        className="inline-flex gap-1 self-start rounded-full bg-white p-1 shadow-[0_12px_40px_rgba(9,16,29,.06)]"
      >
        {TABS.map((t, i) => {
          const on = view === t.key;
          return (
            <button
              key={t.key}
              ref={(el) => {
                refs.current[i] = el;
              }}
              id={`tab-${t.key}`}
              role="tab"
              type="button"
              aria-selected={on}
              aria-controls={`panel-${t.key}`}
              tabIndex={on ? 0 : -1}
              onClick={() => select(t.key)}
              className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border-0 px-[18px] text-sm font-semibold transition-colors ${
                on
                  ? "bg-p500 text-white shadow-[0_6px_16px_-8px_rgba(88,51,167,.8)]"
                  : "bg-transparent text-ink-3 hover:bg-p100 hover:text-p500"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>
      <div id="panel-cal" role="tabpanel" aria-labelledby="tab-cal" hidden={view !== "cal"}>
        {calendar}
      </div>
      <div id="panel-list" role="tabpanel" aria-labelledby="tab-list" hidden={view !== "list"}>
        {list}
      </div>
    </div>
  );
}
