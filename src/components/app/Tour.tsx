"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export type TourStep = { target?: string; title: string; body: string };

/** The guided tour shown to demo visitors (and anyone who clicks "Take the tour"). */
export const HOME_TOUR: TourStep[] = [
  {
    title: "Welcome to SharePa 👋",
    body: "You’re Kata Molnár, a mum of two in Budapest. This one-minute tour shows how parents share school runs and activity rides with friends they trust.",
  },
  {
    target: "week",
    title: "Your family’s week",
    body: "Kata’s kids’ activities, imported from her calendar. Every event shows whether a ride is sorted, who drives and who still needs a seat.",
  },
  {
    target: "ride",
    title: "Manage ride",
    body: "Ask friends for a ride, offer your free seats, or mark “no ride needed”. Try Join: two demo friends answer with driving offers within seconds.",
  },
  {
    target: "views",
    title: "Calendar or list",
    body: "Switch to the list to see every upcoming ride in order, with driving offers waiting for your approval.",
  },
  {
    target: "bell",
    title: "Notifications",
    body: "Ride requests, offers and confirmations land here — and on your phone too, once you switch on push notifications in Profile.",
  },
  {
    target: "profile",
    title: "Profile",
    body: "Kids, friends and their labels, your places on a map, and the app settings: install SharePa and turn on notifications.",
  },
  {
    target: "setup",
    title: "Set-up guide",
    body: "The 7 skippable steps every new parent goes through: calendar import, categories, profile, kids, friends and labels.",
  },
  {
    title: "You’re all set",
    body: "Click around freely — the demo resets every night. Want a clean slate now? Use “Start fresh” in the purple demo bar.",
  },
];

const STORAGE_KEY = "sharepa-tour-done";
const PAD = 8;

/** First visible element for a tour target (lists and calendars can render the same control twice). */
function findTarget(name?: string): HTMLElement | null {
  if (!name) return null;
  const all = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`));
  return all.find((el) => el.getClientRects().length > 0 && el.offsetParent !== null) ?? null;
}

export function Tour({ steps = HOME_TOUR, autoStart = false }: { steps?: TourStep[]; autoStart?: boolean }) {
  const [i, setI] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const [cardH, setCardH] = useState(0);

  // Steps whose target isn't on the page (e.g. no set-up link) are skipped.
  const usable = useCallback(() => steps.filter((s) => !s.target || findTarget(s.target)), [steps]);
  const [list, setList] = useState<TourStep[]>(steps);

  const start = useCallback(() => {
    setList(usable());
    setI(0);
  }, [usable]);

  const close = useCallback(() => {
    setI(null);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* private mode: the tour may show again next time */
    }
  }, []);

  // Start automatically on the first visit, and whenever something asks for it ("Take the tour").
  useEffect(() => {
    const onStart = () => start();
    window.addEventListener("sharepa:tour", onStart);
    let seen = false;
    try {
      seen = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      seen = false;
    }
    const t = autoStart && !seen ? setTimeout(start, 700) : undefined;
    return () => {
      window.removeEventListener("sharepa:tour", onStart);
      if (t) clearTimeout(t);
    };
  }, [autoStart, start]);

  const step = i === null ? null : list[i];

  // Keep the highlight on its element while scrolling or resizing.
  useLayoutEffect(() => {
    if (!step) return;
    const el = findTarget(step.target);
    if (el) el.scrollIntoView({ block: el.offsetHeight > window.innerHeight * 0.6 ? "start" : "center", behavior: "smooth" });
    const measure = () => setRect(el ? el.getBoundingClientRect() : null);
    measure();
    const t = setTimeout(measure, 350);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step]);

  useLayoutEffect(() => {
    if (card.current) setCardH(card.current.offsetHeight);
  }, [step, rect]);

  useEffect(() => {
    if (i === null) return;
    card.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setI((n) => (n !== null && n < list.length - 1 ? n + 1 : n));
      if (e.key === "ArrowLeft") setI((n) => (n ? n - 1 : n));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, list.length, close]);

  if (!step || i === null) return null;
  const last = i === list.length - 1;

  // Card below the element if it fits, otherwise above; centred when there's no element.
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;
  const w = Math.min(360, vw - 24);
  let style: React.CSSProperties;
  if (rect && step.target) {
    const below = rect.bottom + PAD + 12;
    const above = rect.top - PAD - 12 - cardH;
    // Below the element, else above it, else (tall elements) pinned to the bottom of the screen.
    const top = below + cardH < vh - 12 ? below : above >= 12 ? above : vh - cardH - 12;
    const left = Math.min(Math.max(12, rect.left + rect.width / 2 - w / 2), vw - w - 12);
    style = { top, left, width: w };
  } else {
    style = { top: "50%", left: "50%", width: w, transform: "translate(-50%, -50%)" };
  }

  return (
    <div className="fixed inset-0 z-[70]" role="presentation">
      {/* Dimmed page with a spotlight around the current element. */}
      {rect && step.target ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-[20px] transition-all duration-300 ease-out"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: "0 0 0 4px rgba(255,255,255,.9), 0 0 0 9999px rgba(21,8,48,.55)",
          }}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-[rgba(21,8,48,.55)]" />
      )}
      <div className="fixed inset-0" onClick={close} aria-hidden="true" />

      <div
        ref={card}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        className="fixed flex flex-col gap-3 rounded-[24px] bg-white p-5 text-ink shadow-[0_24px_64px_rgba(9,16,29,.32)] outline-none transition-[top,left] duration-300 ease-out"
        style={style}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-[.08em] text-ink-3">
            Tour · {i + 1} of {list.length}
          </span>
          <button type="button" onClick={close} className="cursor-pointer rounded-full border-0 bg-transparent px-2 py-1 text-xs font-semibold text-ink-3 hover:bg-canvas hover:text-ink">
            Skip tour
          </button>
        </div>
        <h2 id="tour-title" className="m-0 text-xl font-bold text-navy">{step.title}</h2>
        <p id="tour-body" className="m-0 text-[15px] leading-relaxed text-ink-2">{step.body}</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <div className="flex gap-1.5" aria-hidden="true">
            {list.map((_, k) => (
              <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-p500" : "w-1.5 bg-p100"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {i > 0 && (
              <button type="button" onClick={() => setI(i - 1)} className="min-h-10 cursor-pointer rounded-full border-0 bg-canvas px-4 text-sm font-bold text-ink-2 hover:bg-p100">
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => (last ? close() : setI(i + 1))}
              className="min-h-10 cursor-pointer rounded-full border-0 bg-p500 px-5 text-sm font-bold text-white hover:bg-p600"
            >
              {last ? "Start exploring" : i === 0 ? "Show me" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Opens the tour from anywhere on the page. */
export const startTour = () => window.dispatchEvent(new Event("sharepa:tour"));
