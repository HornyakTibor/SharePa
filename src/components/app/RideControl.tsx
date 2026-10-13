"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { saveRideChoice } from "@/app/app/actions";
import type { RideMode } from "@/lib/data/home";
import { AddressField, type PlaceValue } from "@/components/map/MapPicker";
import { RoutePreview } from "@/components/map/RoutePreview";

export type RideControlProps = {
  eventId: string;
  title: string;
  category?: string | null;
  activity?: string | null;
  time: string; // HH:MM
  place: string | null;
  placeLat?: number | null;
  placeLng?: number | null;
  date: string; // YYYY-MM-DD
  dateLabel: string; // "Thu 15 Oct"
  mode: RideMode | null;
  compact?: boolean; // narrow calendar columns
  kids: { id: string; name: string }[];
  eventKidIds: string[];
  friends: { id: string; name: string; labels: string[] }[];
  homeAddress: string | null;
  homeLat?: number | null;
  homeLng?: number | null;
  defaultPickup?: PlaceValue | null; // default pick-up point when it isn't home
  firstName: string;
  myRide: { seats: number; pickup: string | null; pickupTime: string | null; pickupLat?: number | null; pickupLng?: number | null } | null;
};

const CHOICES: { mode: RideMode; label: string; short: string }[] = [
  { mode: "join", label: "I’d like to join a ride", short: "Joining" },
  { mode: "drive", label: "I’m driving and have a free seat", short: "Driving" },
  { mode: "none", label: "I don’t need a ride", short: "No ride" },
];

const CarIcon = (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 16l1.6-5.2A2 2 0 0 1 8.5 9.4h7a2 2 0 0 1 1.9 1.4L19 16" /><rect x="3.5" y="15" width="17" height="4" rx="1.5" /><circle cx="7.5" cy="19.5" r="1.2" /><circle cx="16.5" cy="19.5" r="1.2" />
  </svg>
);
const Caret = ({ up }: { up?: boolean }) => (
  <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 transition-transform ${up ? "rotate-180" : ""}`} fill="currentColor" aria-hidden="true"><path d="M7 10l5 5 5-5z" /></svg>
);

function minus30(time: string) {
  const [h, m] = time.split(":").map(Number);
  const total = (h * 60 + m - 30 + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Friends whose labels match this event are suggested first: "Football" for "Football match",
 * "Swimming" or "Sport · Swimming" for an event categorised Sport · Swimming.
 */
function suggested(friends: RideControlProps["friends"], title: string, activity?: string | null, category?: string | null) {
  const t = title.toLowerCase();
  const full = [category, activity].filter(Boolean).join(" · ").toLowerCase();
  const act = (activity ?? "").toLowerCase();
  return friends.filter((f) =>
    f.labels.some((raw) => {
      const l = raw.toLowerCase();
      const tail = l.includes(" · ") ? l.split(" · ")[1] : l;
      return (full && l === full) || (act && tail === act) || t.includes(tail) || tail.includes(t.split(" ")[0]);
    }),
  );
}

export function RideControl(p: RideControlProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [dialogMode, setDialogMode] = useState<"join" | "drive" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const current = CHOICES.find((c) => c.mode === p.mode);

  // Place the menu under its button; fixed positioning so scrolling calendar columns never clip it.
  useLayoutEffect(() => {
    if (!menuOpen || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const width = 280;
    setMenuPos({ top: r.bottom + 6, left: Math.max(12, Math.min(r.left, window.innerWidth - width - 12)) });
    menuRef.current?.querySelector<HTMLButtonElement>("[role=menuitemradio]")?.focus();
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node) || btnRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        btnRef.current?.focus();
      }
    };
    const onScroll = () => setMenuOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const choose = (mode: RideMode) => {
    setMenuOpen(false);
    if (mode === "none") {
      start(async () => {
        const res = await saveRideChoice({ eventId: p.eventId, date: p.date, mode: "none" });
        setToast(res.ok ? res.message : res.error);
      });
    } else {
      setDialogMode(mode);
    }
  };

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitemradio]") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    items[(i + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        data-tour="ride"
        aria-expanded={menuOpen}
        disabled={pending}
        title={current?.label ?? "Manage ride"}
        onClick={() => setMenuOpen((o) => !o)}
        className={`inline-flex max-w-full cursor-pointer items-center rounded-full border-0 font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 ${
          p.compact ? "w-full justify-center gap-1 px-2 py-1.5 text-[11px]" : "gap-1.5 px-3 py-1.5 text-xs"
        } ${menuOpen || current ? "bg-p500 text-white hover:bg-p600" : "bg-p100 text-p600 hover:bg-p200"}`}
      >
        {CarIcon}
        <span className="truncate">{pending ? "Saving…" : current ? (p.compact ? current.short : current.label) : "Manage ride"}</span>
        {!p.compact && <Caret up={menuOpen} />}
      </button>

      {menuOpen && menuPos && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`Ride for ${p.title}, ${p.dateLabel}`}
          onKeyDown={onMenuKey}
          style={{ top: menuPos.top, left: menuPos.left }}
          className="fixed z-50 flex w-[280px] flex-col gap-1 rounded-[20px] bg-white p-2 shadow-[0_12px_32px_rgba(9,16,29,.24)]"
        >
          {CHOICES.map((c) => {
            const on = p.mode === c.mode;
            return (
              <button
                key={c.mode}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                onClick={() => choose(c.mode)}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border-0 px-3 py-3 text-left text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-p300 ${
                  on ? "bg-p100 text-p600" : "bg-transparent text-ink-2 hover:bg-canvas"
                }`}
              >
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${on ? "border-p500" : "border-[#9d9fa4]"}`}>
                  {on && <span className="h-2.5 w-2.5 rounded-full bg-p500" />}
                </span>
                {c.label}
              </button>
            );
          })}
        </div>
      )}

      {dialogMode && (
        <RideDialog
          {...p}
          mode={dialogMode}
          onClose={() => {
            setDialogMode(null);
            btnRef.current?.focus();
          }}
          onDone={(msg) => {
            setDialogMode(null);
            setToast(msg);
          }}
        />
      )}

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-p700 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(9,16,29,.24)]">
          {toast}
        </div>
      )}
    </>
  );
}

/* ---------------- the two-step dialog ---------------- */

type DialogProps = RideControlProps & { mode: "join" | "drive"; onClose: () => void; onDone: (msg: string) => void };

function RideDialog(p: DialogProps) {
  const J = p.mode === "join";
  const ref = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [kids, setKids] = useState<string[]>(() => {
    const pre = p.eventKidIds.filter((id) => p.kids.some((k) => k.id === id));
    return pre.length ? pre : p.kids.length === 1 ? [p.kids[0].id] : [];
  });
  const [seats, setSeats] = useState(p.myRide?.seats ?? 2);
  const initialPick = p.myRide?.pickup
    ? p.myRide.pickup === "School gate" ? "school" : p.myRide.pickup === (p.homeAddress || "My home") || p.myRide.pickup === "My home" ? "home" : "other"
    : p.defaultPickup ? "other" : "home";
  const [pick, setPick] = useState<"home" | "school" | "other">(initialPick);
  const [other, setOther] = useState<PlaceValue>(() =>
    initialPick !== "other"
      ? { address: "" }
      : p.myRide?.pickup
        ? { address: p.myRide.pickup, lat: p.myRide.pickupLat, lng: p.myRide.pickupLng }
        : (p.defaultPickup ?? { address: "" }),
  );
  const pickText = other.address;
  const [time, setTime] = useState(p.myRide?.pickupTime?.slice(0, 5) || minus30(p.time));
  const [recips, setRecips] = useState<string[]>(() => {
    const s = suggested(p.friends, p.title, p.activity, p.category).map((f) => f.id);
    return s.length ? s : p.friends.map((f) => f.id);
  });
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const kidNames = p.kids.filter((k) => kids.includes(k.id)).map((k) => k.name);
  const pickupText = pick === "home" ? p.homeAddress || "My home" : pick === "school" ? "School gate" : pickText.trim();
  const pickupAt =
    pick === "home" ? { lat: p.homeLat ?? null, lng: p.homeLng ?? null } : pick === "other" ? { lat: other.lat ?? null, lng: other.lng ?? null } : { lat: null, lng: null };
  const defaultNote = J
    ? `Hi! ${kidNames.join(" and ")} need${kidNames.length > 1 ? "" : "s"} a ride to ${p.title} on ${p.dateLabel} (${p.time}). Could anyone take ${kidNames.length > 1 ? "them" : "them along"}? Thanks, ${p.firstName}`
    : `Hi! I’m driving to ${p.title} on ${p.dateLabel} and have ${seats} free seat${seats > 1 ? "s" : ""}. Pick-up at ${time} from ${pick === "home" ? "my home" : pick === "school" ? "the school gate" : pickText.trim()}. Reply if your kid wants to join! ${p.firstName}`;

  const step1ok = J ? kids.length > 0 : pick !== "other" || pickText.trim().length > 0;
  const steps = J ? ["Who needs a ride", "Notify parents"] : ["Seats & pick-up", "Notify parents"];

  const next = () => {
    setNote(defaultNote);
    setStep(2);
  };
  const send = () => {
    setError(null);
    start(async () => {
      const res = await saveRideChoice({
        eventId: p.eventId,
        date: p.date,
        mode: p.mode,
        childIds: kids,
        notifiedIds: recips,
        note,
        seats,
        pickup: pickupText,
        pickupLat: pickupAt.lat,
        pickupLng: pickupAt.lng,
        pickupTime: time,
      });
      if (res.ok) p.onDone(res.message);
      else setError(res.error);
    });
  };

  const sendLabel = p.friends.length
    ? `Send note to ${recips.length} parent${recips.length === 1 ? "" : "s"}`
    : J ? "Save request" : "Save offer";

  return (
    <dialog
      ref={ref}
      aria-labelledby="ride-dialog-title"
      onClose={p.onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-auto w-[min(560px,calc(100vw-24px))] max-h-[calc(100dvh-24px)] overflow-y-auto rounded-[28px] border-0 bg-white p-0 text-ink shadow-[0_24px_64px_rgba(9,16,29,.32)] backdrop:bg-[rgba(21,8,48,.35)] backdrop:backdrop-blur-[3px]"
    >
      <div className="flex flex-col gap-5 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-[.08em] text-ink-3">
              {p.title} · {p.dateLabel} · {p.time}
            </p>
            <h2 id="ride-dialog-title" className="mt-1 mb-0 text-2xl font-bold text-navy">
              {J ? "I’d like to join a ride" : "I’m driving and have a free seat"}
            </h2>
          </div>
          <button type="button" aria-label="Close" onClick={() => ref.current?.close()} className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-canvas text-ink-2 hover:bg-p100">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
          </button>
        </div>

        <ol className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Steps">
          {steps.map((s, i) => (
            <li
              key={s}
              aria-current={step === i + 1 ? "step" : undefined}
              className={`rounded-full px-3 py-1 text-[13px] font-semibold ${step === i + 1 ? "bg-p500 text-white" : step > i + 1 ? "bg-p100 text-p600" : "bg-canvas text-ink-3"}`}
            >
              {i + 1}. {s}
            </li>
          ))}
        </ol>

        {step === 1 && J && (
          <div className="flex flex-col gap-3">
            <p className="m-0 text-sm text-ink-3">Pick the kids who need a ride to {p.title}.</p>
            {p.kids.length ? (
              <div className="flex flex-wrap gap-2">
                {p.kids.map((k) => {
                  const on = kids.includes(k.id);
                  return (
                    <button
                      key={k.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setKids((cur) => (on ? cur.filter((x) => x !== k.id) : [...cur, k.id]))}
                      className={`cursor-pointer rounded-full border-0 px-[18px] py-2 text-base font-semibold ${on ? "bg-p500 text-white" : "bg-canvas text-ink-2 shadow-[inset_0_0_0_1px_#cdcfd2] hover:bg-p100"}`}
                    >
                      {k.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="m-0 rounded-2xl bg-canvas px-4 py-4 text-sm text-ink-3">You haven’t added any children yet.</p>
            )}
          </div>
        )}

        {step === 1 && !J && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-ink-2" id="seats-label">Free seats</span>
              <div role="group" aria-labelledby="seats-label" className="inline-flex gap-1 self-start rounded-full bg-canvas p-1">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={seats === n}
                    onClick={() => setSeats(n)}
                    className={`h-10 w-12 cursor-pointer rounded-full border-0 text-sm font-bold ${seats === n ? "bg-p500 text-white" : "bg-transparent text-ink-2 hover:bg-white"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
              <legend className="mb-2 p-0 text-sm font-semibold text-ink-2">Pick-up point</legend>
              {(
                [
                  ["home", "My home", p.homeAddress || "Home address (not set yet)"],
                  ["school", "School gate", "Main gate of the school"],
                  ["other", "Somewhere else", ""],
                ] as const
              ).map(([k, t, sub]) => (
                <label
                  key={k}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl px-4 py-3 ${pick === k ? "bg-p100 shadow-[inset_0_0_0_2px_#5833A7]" : "bg-canvas hover:bg-p100/60"}`}
                >
                  <input type="radio" name="pick" value={k} checked={pick === k} onChange={() => setPick(k)} className="mt-1 h-4 w-4 accent-p500" />
                  <span className="flex flex-col">
                    <b className="text-sm text-ink">{t}</b>
                    {sub && <span className="text-xs text-ink-3">{sub}</span>}
                  </span>
                </label>
              ))}
              {pick === "other" && (
                <AddressField
                  value={other}
                  onChange={setOther}
                  placeholder="e.g. Bikás park, bus stop"
                  title="Choose the pick-up point"
                  inputClassName="min-h-12 w-full rounded-2xl border-0 bg-canvas px-4 text-base outline-none focus:bg-white focus:shadow-[inset_0_0_0_2px_#5833A7] focus:ring-4 focus:ring-p100"
                />
              )}
            </fieldset>
            <label className="flex max-w-[200px] flex-col gap-2 text-sm font-semibold text-ink-2">
              Pick-up time
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="min-h-12 rounded-2xl border-0 bg-canvas px-4 font-mono text-base outline-none focus:bg-white focus:shadow-[inset_0_0_0_2px_#5833A7] focus:ring-4 focus:ring-p100" />
            </label>
            <span className="text-xs text-ink-3">
              The event starts at {p.time}{p.place ? ` at ${p.place}` : ""}.
            </span>
            <RoutePreview
              height="h-[180px]"
              pickups={pickupAt.lat != null && pickupAt.lng != null ? [{ lat: pickupAt.lat, lng: pickupAt.lng, label: pickupText }] : []}
              place={p.placeLat != null && p.placeLng != null ? { lat: p.placeLat, lng: p.placeLng, label: p.place ?? p.title } : null}
            />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            {p.friends.length ? (
              <>
                <p className="m-0 text-sm text-ink-3">
                  {J ? "Parents who could drive." : "Parents going to the same kind of activity."} Everyone ticked gets your note in SharePa.
                </p>
                <ul className="m-0 flex max-h-[260px] list-none flex-col overflow-y-auto rounded-2xl bg-canvas p-1">
                  {p.friends.map((f) => {
                    const on = recips.includes(f.id);
                    return (
                      <li key={f.id}>
                        <label className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ${on ? "bg-white" : "hover:bg-white/60"}`}>
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => setRecips((cur) => (on ? cur.filter((x) => x !== f.id) : [...cur, f.id]))}
                            className="h-[18px] w-[18px] accent-p500"
                          />
                          <span className="flex min-w-0 flex-col">
                            <b className="text-sm text-ink">{f.name}</b>
                            <span className="truncate text-xs text-ink-3">Friend{f.labels.length ? ` · ${f.labels.join(", ")}` : ""}</span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <p className="m-0 rounded-2xl bg-canvas px-4 py-4 text-sm text-ink-3">
                You have no friends in SharePa yet, so nobody will be notified. Your choice is still saved.
              </p>
            )}
            <label className="flex flex-col gap-2 text-sm font-semibold text-ink-2">
              Your note
              <textarea
                rows={4}
                value={note}
                maxLength={1000}
                onChange={(e) => setNote(e.target.value)}
                className="rounded-2xl border-0 bg-canvas px-4 py-3 text-[15px] leading-relaxed font-medium text-ink outline-none focus:bg-white focus:shadow-[inset_0_0_0_2px_#5833A7] focus:ring-4 focus:ring-p100"
              />
            </label>
          </div>
        )}

        {error && (
          <p role="alert" className="m-0 rounded-2xl bg-err-bg px-4 py-3 text-sm font-medium text-err">
            {error}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          {step === 1 ? (
            <button type="button" onClick={() => ref.current?.close()} className="min-h-12 cursor-pointer rounded-full border-0 bg-white px-5 text-sm font-bold text-p500 shadow-[inset_0_0_0_2px_#5833A7] hover:bg-p100">
              Cancel
            </button>
          ) : (
            <button type="button" onClick={() => setStep(1)} className="min-h-12 cursor-pointer rounded-full border-0 bg-white px-5 text-sm font-bold text-p500 shadow-[inset_0_0_0_2px_#5833A7] hover:bg-p100">
              Back
            </button>
          )}
          {step === 1 ? (
            <button type="button" disabled={!step1ok} onClick={next} className="min-h-12 cursor-pointer rounded-full border-0 bg-p500 px-6 text-sm font-bold text-white hover:bg-p600 disabled:cursor-not-allowed disabled:opacity-40">
              Next
            </button>
          ) : (
            <button
              type="button"
              disabled={pending || (p.friends.length > 0 && recips.length === 0)}
              onClick={send}
              className="min-h-12 cursor-pointer rounded-full border-0 bg-p500 px-6 text-sm font-bold text-white hover:bg-p600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? "Sending…" : sendLabel}
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
