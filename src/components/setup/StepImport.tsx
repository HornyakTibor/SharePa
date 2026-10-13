"use client";

import { useRef, useState } from "react";
import { addEvent, importEvents, importSampleCalendar, removeEvent } from "@/app/app/setup/actions";
import type { SetupEvent } from "@/lib/data/setup";
import { parseIcs } from "@/lib/ics";
import { WEEKDAYS } from "@/lib/dates";
import { btn, cx, inputCls, Label, useSetupAction } from "./ui";

const PROVIDERS = [
  {
    key: "Google",
    steps: ["Open calendar.google.com on a computer.", "Settings (gear icon) → Import & export → Export.", "Unzip the download and choose your family calendar’s .ics file below."],
  },
  {
    key: "Microsoft",
    steps: ["Open your calendar in Outlook for Windows or Mac.", "Choose File → Save Calendar (Mac: File → Export).", "Save it as an .ics file and choose it below."],
  },
  {
    key: "Apple",
    steps: ["Open the Calendar app on your Mac.", "Select your family calendar, then File → Export → Export…", "Choose the saved .ics file below."],
  },
];

const CalIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" />
  </svg>
);

export function StepImport({
  events,
  dayOptions,
  today,
  rangeEnd,
}: {
  events: SetupEvent[];
  dayOptions: { weekday: number; label: string }[];
  today: string;
  rangeEnd: string;
}) {
  const { pending, run, toast, say } = useSetupAction();
  const [provider, setProvider] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(events.length === 0);
  const [form, setForm] = useState({ title: "", place: "", day: "0", time: "16:00" });
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 3_000_000) return say("This file is too big. Export a single calendar instead.", true);
    const list = parseIcs(await file.text(), today, rangeEnd);
    if (fileRef.current) fileRef.current.value = "";
    if (!list.length) return say("We couldn’t find weekly or upcoming events in this file.", true);
    run(() => importEvents(list), (r) => r.ok && setProvider(null));
  };

  const titles = [...new Set(events.map((e) => e.title))];
  const places = [...new Set(events.map((e) => e.place).filter(Boolean))] as string[];

  return (
    <div className="flex flex-col gap-5">
      {events.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3 rounded-2xl bg-ok-bg px-4 py-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ok text-sm font-bold text-white">✓</span>
            <p className="m-0 text-sm text-ink-2">
              <b className="text-ink">{events.length} event{events.length === 1 ? "" : "s"} in SharePa.</b> You’ll choose which ones SharePa uses in the next step.
            </p>
          </div>
          <ul className="m-0 flex list-none flex-col p-0">
            {[...events].sort((a, b) => a.weekday - b.weekday || a.time.localeCompare(b.time)).slice(0, 8).map((e) => (
              <li key={e.id} className="flex items-center gap-3 border-t border-black/5 py-2.5 text-sm first:border-t-0">
                <span className="w-[86px] shrink-0 font-mono text-[13px] text-ink-3">{WEEKDAYS[e.weekday]} · {e.time}</span>
                <b className="min-w-0 grow truncate text-ink">{e.title}</b>
                <span className="hidden min-w-0 truncate text-ink-3 sm:inline">{e.place}</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => removeEvent(e.id))}
                  aria-label={`Remove ${e.title}`}
                  className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-ink-3 hover:bg-err-bg hover:text-err"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          {events.length > 8 && <p className="m-0 text-xs text-ink-3">…and {events.length - 8} more.</p>}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {PROVIDERS.map((p) => (
          <button
            key={p.key}
            type="button"
            aria-expanded={provider === p.key}
            onClick={() => setProvider(provider === p.key ? null : p.key)}
            className={cx(
              "flex min-h-[52px] cursor-pointer items-center justify-center gap-2.5 rounded-full border-0 px-4 text-sm font-bold transition-colors",
              provider === p.key ? "bg-p500 text-white" : "bg-white text-ink shadow-[inset_0_0_0_1.5px_#e3e5e8] hover:bg-p100",
            )}
          >
            <CalIcon />
            {p.key} calendar
          </button>
        ))}
      </div>

      {provider && (
        <div className="flex flex-col gap-3 rounded-[20px] bg-canvas p-5">
          <p className="m-0 text-sm font-bold text-navy">Import from {provider} calendar</p>
          <ol className="m-0 flex flex-col gap-1.5 pl-5 text-sm text-ink-2">
            {PROVIDERS.find((p) => p.key === provider)!.steps.map((s) => <li key={s}>{s}</li>)}
          </ol>
          <div className="flex flex-wrap items-center gap-3">
            <input ref={fileRef} type="file" accept=".ics,text/calendar" className="sr-only" id="ics-file" onChange={(e) => onFile(e.target.files?.[0])} />
            <label htmlFor="ics-file" className={cx(btn.base, btn.pri, pending && "pointer-events-none opacity-60")}>
              {pending ? "Importing…" : "Choose .ics file"}
            </label>
            <span className="text-xs text-ink-3">We read titles, days, times and places — nothing else is stored.</span>
          </div>
          <p className="m-0 text-xs text-ink-3">Direct connection to Google and Microsoft calendars is coming later.</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-[20px] border-2 border-dashed border-[#e3e5e8] px-5 py-4">
        <p className="m-0 grow text-sm text-ink-2"><b className="text-ink">No calendar file at hand?</b> Load a sample family week to see how it works.</p>
        <button type="button" disabled={pending} onClick={() => run(() => importSampleCalendar())} className={cx(btn.base, btn.sec, btn.sm)}>
          Load sample calendar
        </button>
      </div>

      <details open={manualOpen} onToggle={(e) => setManualOpen((e.target as HTMLDetailsElement).open)} className="group rounded-[20px] bg-white shadow-[inset_0_0_0_1.5px_#e3e5e8]">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-bold text-navy">
          Or add events yourself
          <span aria-hidden="true" className="text-lg text-p500 transition-transform group-open:rotate-45">+</span>
        </summary>
        <form
          className="flex flex-col gap-4 px-5 pb-5"
          onSubmit={(e) => {
            e.preventDefault();
            const weekday = dayOptions[Number(form.day)]?.weekday ?? 0;
            run(() => addEvent({ title: form.title, place: form.place, weekday, time: form.time }), (r) => r.ok && setForm({ ...form, title: "", place: "" }));
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Label text="Event">
              <input className={inputCls} list="ob-titles" required placeholder="e.g. Swimming practice" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Label>
            <Label text="Place">
              <input className={inputCls} list="ob-places" placeholder="e.g. Komjádi pool" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} />
            </Label>
          </div>
          <datalist id="ob-titles">{titles.map((t) => <option key={t} value={t} />)}</datalist>
          <datalist id="ob-places">{places.map((t) => <option key={t} value={t} />)}</datalist>
          <div className="flex flex-wrap items-end gap-4">
            <Label text="Day" className="min-w-[200px] grow">
              <select className={inputCls} value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>
                {dayOptions.map((d, k) => <option key={k} value={k}>{d.label}</option>)}
              </select>
            </Label>
            <Label text="Time" className="w-[140px]">
              <input type="time" required className={cx(inputCls, "font-mono")} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </Label>
            <button disabled={pending} className={cx(btn.base, btn.sec, "min-h-12")}>+ Add event</button>
          </div>
          <p className="m-0 text-xs text-ink-3">Events repeat every week on the same day and time.</p>
        </form>
      </details>
      {toast}
    </div>
  );
}
