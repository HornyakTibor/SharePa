"use client";

import { useState } from "react";
import { setFriendLabels } from "@/app/app/setup/actions";
import type { SetupEvent } from "@/lib/data/setup";
import { Avatar } from "@/components/app/Avatar";
import { categoryStyle } from "@/lib/categories";
import { TAXONOMY } from "@/lib/taxonomy";
import { WEEKDAYS } from "@/lib/dates";
import { btn, cx, Empty, inputCls, Note, useSetupAction } from "./ui";

type Friend = { id: string; name: string; labels: string[] };

const isCat = (l: string) => l.includes(" · ");
const show = (l: string) => l.replace(" · ", " / ");

export function StepLabels({ friends, events }: { friends: Friend[]; events: SetupEvent[] }) {
  const { run, toast } = useSetupAction();
  const [labels, setLabels] = useState<Record<string, string[]>>(() => Object.fromEntries(friends.map((f) => [f.id, f.labels])));
  const [open, setOpen] = useState<string | null>(null);
  const [custom, setCustom] = useState("");

  // Activities from the parent's own calendar, e.g. "Sport · Swimming" with the events behind it.
  const fromCal = new Map<string, SetupEvent[]>();
  events.filter((e) => e.category && e.needsRide && !e.hidden).forEach((e) => {
    const l = [e.category, e.activity].filter(Boolean).join(" · ");
    fromCal.set(l, [...(fromCal.get(l) ?? []), e]);
  });
  const ownLabels = [...new Set(Object.values(labels).flat().filter((l) => !isCat(l)))];
  const labelled = friends.filter((f) => labels[f.id]?.length).length;

  const update = (id: string, next: string[]) => {
    const before = labels[id];
    setLabels({ ...labels, [id]: next });
    run(() => setFriendLabels(id, next), (r) => !r.ok && setLabels((l) => ({ ...l, [id]: before })));
  };
  const toggle = (id: string, l: string) => {
    const cur = labels[id] ?? [];
    update(id, cur.includes(l) ? cur.filter((x) => x !== l) : [...cur, l]);
  };

  if (!friends.length) return <Empty>No friends to label yet. Add friends in the previous step.</Empty>;

  const chip = (on: boolean, style?: { bg: string; fg: string }) =>
    cx("cursor-pointer rounded-full border-0 px-3 py-1.5 text-xs font-bold transition-shadow", on ? "shadow-[inset_0_0_0_2px_currentColor]" : "hover:shadow-[inset_0_0_0_1px_currentColor]", !style && (on ? "bg-p500 text-white" : "bg-canvas text-ink-2"));

  return (
    <div className="flex flex-col gap-4">
      <Note><b>Link each friend to the activities you share.</b> When you need a ride to Swimming, SharePa asks the friends labelled Sport / Swimming first.</Note>
      <span className="text-sm text-ink-3"><b className="font-mono text-navy">{labelled}</b> of {friends.length} friends labelled</span>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {friends.map((f) => {
          const mine = labels[f.id] ?? [];
          const isOpen = open === f.id;
          return (
            <li key={f.id} className={cx("rounded-[20px] p-3 transition-colors", isOpen ? "bg-canvas" : "bg-white")}>
              <div className="flex items-start gap-3">
                <Avatar name={f.name} />
                <div className="flex min-w-0 grow flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <b className="text-ink">{f.name}</b>
                    <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : f.id)} className={cx(btn.base, isOpen ? btn.pri : btn.sec, btn.sm)}>
                      {isOpen ? "Done" : "+ Add event label"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {mine.length ? mine.map((l) => {
                      const s = isCat(l) ? categoryStyle(l.split(" · ")[0]) : null;
                      return (
                        <span key={l} className="flex items-center gap-1 rounded-full py-0.5 pr-0.5 pl-2.5 text-xs font-semibold" style={s ? { background: s.bg, color: s.fg } : { background: "#ece8f9", color: "#4a2a8c" }}>
                          {show(l)}
                          <button type="button" aria-label={`Remove label ${show(l)}`} onClick={() => toggle(f.id, l)} className="grid h-5 w-5 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-current hover:bg-white/70">×</button>
                        </span>
                      );
                    }) : <span className="text-xs text-ink-3">No labels yet</span>}
                  </div>
                </div>
              </div>
              {isOpen && (
                <div className="mt-4 flex flex-col gap-4 sm:pl-[52px]">
                  <section className="flex flex-col gap-2">
                    <h3 className="m-0 text-xs font-bold uppercase tracking-[.08em] text-ink-3">From your calendar</h3>
                    {fromCal.size ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {[...fromCal].map(([l, evs]) => {
                          const on = mine.includes(l);
                          const s = categoryStyle(l.split(" · ")[0]);
                          return (
                            <button key={l} type="button" aria-pressed={on} onClick={() => toggle(f.id, l)} className={cx("flex cursor-pointer flex-col gap-0.5 rounded-2xl border-0 p-3 text-left", on ? "shadow-[inset_0_0_0_2px_currentColor]" : "")} style={{ background: s.bg, color: s.fg }}>
                              <b className="text-sm">{on ? "✓ " : ""}{show(l)}</b>
                              <span className="text-xs text-ink-3">{evs.map((e) => `${e.title} · ${WEEKDAYS[e.weekday]} ${e.time}`).join(", ")}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="m-0 text-sm text-ink-3">No categorized events yet.</p>
                    )}
                  </section>
                  <details className="group">
                    <summary className="cursor-pointer list-none text-xs font-bold uppercase tracking-[.08em] text-ink-3">
                      All categories <span className="font-semibold normal-case tracking-normal">· Sport, Music, Art and more</span> <span className="text-p500 group-open:hidden">+</span>
                    </summary>
                    <div className="mt-3 flex flex-col gap-3">
                      {TAXONOMY.map((t) => {
                        const s = categoryStyle(t.name);
                        return (
                          <div key={t.name} className="flex flex-wrap gap-1.5">
                            {t.activities.map((a) => {
                              const l = `${t.name} · ${a}`;
                              const on = mine.includes(l);
                              return (
                                <button key={l} type="button" aria-pressed={on} onClick={() => toggle(f.id, l)} className={chip(on, s)} style={{ background: s.bg, color: s.fg }}>
                                  {t.name} / {a}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </details>
                  <section className="flex flex-col gap-2">
                    <h3 className="m-0 text-xs font-bold uppercase tracking-[.08em] text-ink-3">Custom label</h3>
                    {ownLabels.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {ownLabels.map((l) => (
                          <button key={l} type="button" aria-pressed={mine.includes(l)} onClick={() => toggle(f.id, l)} className={chip(mine.includes(l))}>{l}</button>
                        ))}
                      </div>
                    )}
                    <form
                      className="flex flex-wrap items-end gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const l = custom.trim();
                        if (l && !mine.includes(l)) update(f.id, [...mine, l]);
                        setCustom("");
                      }}
                    >
                      <input className={cx(inputCls, "min-w-[200px] flex-1 bg-white")} aria-label="New custom label" placeholder="e.g. Class 3B, Neighbours, Carpool buddy" value={custom} onChange={(e) => setCustom(e.target.value)} />
                      <button className={cx(btn.base, btn.sec, "min-h-12")}>+ Add label</button>
                    </form>
                  </section>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {toast}
    </div>
  );
}
