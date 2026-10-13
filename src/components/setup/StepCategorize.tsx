"use client";

import { useEffect, useRef, useState } from "react";
import { applyAllSuggestions, setEventCategory } from "@/app/app/setup/actions";
import type { SetupEvent } from "@/lib/data/setup";
import { categoryStyle } from "@/lib/categories";
import { suggestCategory, TAXONOMY } from "@/lib/taxonomy";
import { WEEKDAYS } from "@/lib/dates";
import { btn, cx, inputCls, Note, useSetupAction, WeekGrid } from "./ui";

type Kid = { id: string; name: string };

export function StepCategorize({ events, dates, kids }: { events: SetupEvent[]; dates: string[]; kids: Kid[] }) {
  const { pending, run, toast } = useSetupAction();
  const [open, setOpen] = useState<SetupEvent | null>(null);
  const done = events.filter((e) => e.category || !e.needsRide).length;
  const canSuggest = events.some((e) => !e.category && e.needsRide && suggestCategory(e.title));
  const groups = [...new Set(events.filter((e) => e.category && e.needsRide).map((e) => e.category!))];

  return (
    <div className="flex flex-col gap-4">
      <Note>
        <b>Click an event to set its category.</b> Pick a category first, then the exact activity — like Sport · Soccer — so parents going to the same activity can find each other.
      </Note>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-ink-3"><b className="font-mono text-navy">{done}</b> of {events.length} events categorized</span>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={!canSuggest || pending} onClick={() => run(() => applyAllSuggestions())} className={cx(btn.base, btn.ghost, btn.sm)}>
            Select all category suggestions
          </button>
          {groups.map((g) => {
            const s = categoryStyle(g);
            return <span key={g} className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: s.bg, color: s.fg }}>{g}</span>;
          })}
        </div>
      </div>
      <WeekGrid
        events={events}
        dates={dates}
        render={(e) => {
          const s = categoryStyle(e.category);
          const skip = !e.needsRide;
          return (
            <button
              type="button"
              onClick={() => setOpen(e)}
              className={cx(
                "flex w-full cursor-pointer flex-col gap-1 rounded-xl border-0 bg-white p-2.5 text-left transition-shadow",
                skip && "opacity-65",
                !e.category && !skip && "outline-dashed outline-[1.5px] -outline-offset-[1.5px] outline-[#cdcfd2]",
              )}
              style={e.category && !skip ? { boxShadow: `inset 0 0 0 2px ${s.fg}` } : undefined}
            >
              <span className="font-mono text-[12px] text-ink-3">{e.time}</span>
              <b className="text-[13px] leading-tight text-ink [overflow-wrap:anywhere]">{e.title}</b>
              {e.place && <span className="text-[11px] leading-tight text-ink-3 [overflow-wrap:anywhere]">{e.place}</span>}
              {skip ? (
                <span className="mt-1 self-start rounded-lg bg-canvas px-1.5 py-1 text-[11px] font-bold text-ink-3">No ride needed</span>
              ) : e.category ? (
                <span className="mt-1 grid self-start rounded-lg px-1.5 py-1 text-[11px] font-bold leading-tight" style={{ background: s.bg, color: s.fg }}>
                  {e.category}
                  {e.activity && <i className="font-semibold not-italic opacity-85">{e.activity}</i>}
                </span>
              ) : (
                <span className="mt-1 self-start rounded-lg px-1.5 py-1 text-[11px] font-bold text-p500 outline-dashed outline-1 outline-[#cdcfd2]">+ Set category</span>
              )}
            </button>
          );
        }}
      />
      {open && <CategoryDialog event={open} kids={kids} onClose={() => setOpen(null)} run={run} pending={pending} />}
      {toast}
    </div>
  );
}

function CategoryDialog({
  event,
  kids,
  onClose,
  run,
  pending,
}: {
  event: SetupEvent;
  kids: Kid[];
  onClose: () => void;
  run: ReturnType<typeof useSetupAction>["run"];
  pending: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const known = TAXONOMY.find((t) => t.name === event.category);
  const [step, setStep] = useState(1);
  const [cat, setCat] = useState<string | null>(event.category ? (known ? event.category : "__other") : null);
  const [catOther, setCatOther] = useState(event.category && !known ? event.category : "");
  const [sub, setSub] = useState<string | null>(
    event.activity ? ((known?.activities as readonly string[] | undefined)?.includes(event.activity) ? event.activity : "__other") : null,
  );
  const [subOther, setSubOther] = useState(event.activity && sub === "__other" ? event.activity : "");
  const [childIds, setChildIds] = useState<string[]>(event.childIds);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const group = TAXONOMY.find((t) => t.name === cat);
  const catName = cat === "__other" ? catOther.trim() : cat ?? "";
  const subName = sub === "__other" ? subOther.trim() : sub ?? "";
  const sg = suggestCategory(event.title);
  const save = (category: string | null, activity: string | null) =>
    run(() => setEventCategory({ eventId: event.id, category, activity, childIds }), (r) => r.ok && ref.current?.close());

  const tile = (on: boolean) =>
    cx("flex cursor-pointer items-center gap-3 rounded-2xl border-0 p-3 text-left transition-shadow", on ? "bg-p100 shadow-[inset_0_0_0_2px_#5833A7]" : "bg-canvas hover:bg-p100/60");

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="cat-title"
      className="m-auto w-[min(640px,calc(100vw-24px))] max-h-[calc(100dvh-24px)] overflow-y-auto rounded-[28px] border-0 bg-white p-0 text-ink shadow-[0_24px_64px_rgba(9,16,29,.32)] backdrop:bg-[rgba(21,8,48,.35)] backdrop:backdrop-blur-[3px]"
    >
      <div className="flex flex-col gap-5 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-[.08em] text-ink-3">{event.title} · {WEEKDAYS[event.weekday]} {event.time}</p>
            <h2 id="cat-title" className="mt-1 mb-0 text-2xl font-bold text-navy">{step === 1 ? "Choose a category" : `${catName}: choose the activity`}</h2>
          </div>
          <button type="button" aria-label="Close" onClick={() => ref.current?.close()} className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-canvas text-ink-2 hover:bg-p100">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
          </button>
        </div>
        <ol className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Steps">
          <li className={cx("rounded-full px-3 py-1 text-[13px] font-semibold", step === 1 ? "bg-p500 text-white" : "bg-p100 text-p600")}>1. Category{step === 2 ? `: ${catName}` : ""}</li>
          <li className={cx("rounded-full px-3 py-1 text-[13px] font-semibold", step === 2 ? "bg-p500 text-white" : "bg-canvas text-ink-3")}>2. Activity</li>
        </ol>

        {step === 1 ? (
          <div className="flex flex-col gap-3">
            {sg && !(event.category === sg.category && event.activity === sg.activity) && (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl p-4" style={{ background: categoryStyle(sg.category).bg }}>
                <div className="min-w-0 grow">
                  <p className="m-0 text-[11px] font-bold uppercase tracking-[.08em] text-ink-3">Suggested from the event name</p>
                  <b className="text-navy">{sg.category}{sg.activity ? ` / ${sg.activity}` : ""}</b>
                  <p className="m-0 text-xs text-ink-3">Because “{event.title}” contains “{sg.word}”.</p>
                </div>
                <div className="flex gap-2">
                  {sg.activity && (
                    <button type="button" disabled={pending} onClick={() => save(sg.category, sg.activity)} className={cx(btn.base, btn.pri, btn.sm)}>Apply</button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setCat(sg.category); setSub(sg.activity); setStep(2); }}
                    className={cx(btn.base, btn.sm, "bg-white text-p600 hover:bg-p100")}
                  >
                    {sg.activity ? "Change activity" : "Use and pick activity"}
                  </button>
                </div>
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              {TAXONOMY.map((t) => {
                const s = categoryStyle(t.name);
                return (
                  <button key={t.name} type="button" aria-pressed={cat === t.name} onClick={() => { setCat(t.name); setSub(null); }} className={tile(cat === t.name)}>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold" style={{ background: s.bg, color: s.fg }}>{t.icon}</span>
                    <span className="flex flex-col"><b className="text-sm text-ink">{t.name}</b><span className="text-xs text-ink-3">{t.hint}</span></span>
                  </button>
                );
              })}
            </div>
            <label className={cx(tile(cat === "__other"), "cursor-text flex-col items-stretch gap-2 text-sm font-semibold text-ink-2")}>
              Your own category
              <input className={cx(inputCls, "bg-white")} placeholder="e.g. Scouts, Chess club" value={catOther} onFocus={() => setCat("__other")} onChange={(e) => { setCatOther(e.target.value); setCat("__other"); }} />
            </label>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {group ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {group.activities.map((a) => (
                  <button key={a} type="button" aria-pressed={sub === a} onClick={() => setSub(a)} className={cx(tile(sub === a), "justify-center font-bold text-sm text-ink")}>
                    {a}
                  </button>
                ))}
              </div>
            ) : (
              <p className="m-0 text-sm text-ink-3">Add an activity name, or apply the category on its own.</p>
            )}
            <label className="flex flex-col gap-2 text-sm font-semibold text-ink-2">
              {group ? "Something else" : "Activity (optional)"}
              <input className={inputCls} placeholder={group ? "e.g. Water polo" : "e.g. Weekly meeting"} value={subOther} onFocus={() => setSub("__other")} onChange={(e) => { setSubOther(e.target.value); setSub("__other"); }} />
            </label>
            {kids.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-ink-2">Who goes? <span className="font-normal text-ink-3">(optional)</span></span>
                <div className="flex flex-wrap gap-2">
                  {kids.map((k) => {
                    const on = childIds.includes(k.id);
                    return (
                      <button
                        key={k.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setChildIds(on ? childIds.filter((x) => x !== k.id) : [...childIds, k.id])}
                        className={cx("cursor-pointer rounded-full border-0 px-[18px] py-2 text-sm font-semibold", on ? "bg-p500 text-white" : "bg-canvas text-ink-2 shadow-[inset_0_0_0_1px_#cdcfd2] hover:bg-p100")}
                      >
                        {k.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <p className="m-0 rounded-2xl border-2 border-dashed border-[#e3e5e8] px-4 py-3 text-sm text-ink-3">
              Will be saved as <b className="text-navy">{catName}{subName ? ` · ${subName}` : ""}</b>
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-5">
          {step === 1 ? (
            <button type="button" disabled={pending} onClick={() => save(null, null)} className={cx(btn.base, btn.ghost)}>No ride needed</button>
          ) : (
            <button type="button" onClick={() => setStep(1)} className={cx(btn.base, btn.sec)}>Back</button>
          )}
          {step === 1 ? (
            <button type="button" disabled={!catName} onClick={() => setStep(2)} className={cx(btn.base, btn.pri)}>Next</button>
          ) : (
            <button type="button" disabled={pending || !catName || (!!group && !subName)} onClick={() => save(catName, subName || null)} className={cx(btn.base, btn.pri)}>
              {pending ? "Saving…" : "Apply"}
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
