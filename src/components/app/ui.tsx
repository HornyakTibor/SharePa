import type { Occurrence } from "@/lib/data/home";
import { categoryLabel, categoryStyle } from "@/lib/categories";

const AVATAR_COLORS = [
  ["#e3def7", "#5833a7"], ["#f5eff1", "#89556c"], ["#fef3a1", "#645d18"],
  ["#f3eff7", "#6e4b8c"], ["#e4ecf6", "#043873"], ["#e4d1d8", "#5d3848"],
];

export function initials(name: string) {
  return name.split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const [bg, fg] = AVATAR_COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full text-sm font-bold"
      style={{ width: size, height: size, background: bg, color: fg }}
    >
      {initials(name)}
    </span>
  );
}

export function CategoryTag({ category, activity }: { category: string | null; activity: string | null }) {
  if (!category) return null;
  const s = categoryStyle(category);
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold" style={{ background: s.bg, color: s.fg }}>
      {categoryLabel(category, activity)}
    </span>
  );
}

export function Card({ children, className = "", label }: { children: React.ReactNode; className?: string; label?: string }) {
  return (
    <section aria-label={label} className={`min-w-0 rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(9,16,29,.06)] sm:p-7 ${className}`}>
      {children}
    </section>
  );
}

export function CardTitle({ icon, children, aside }: { icon: React.ReactNode; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="m-0 flex items-center gap-2.5 text-xl font-semibold text-navy">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-p100 text-p500">{icon}</span>
        {children}
      </h2>
      {aside}
    </div>
  );
}

const first = (name: string) => name.split(" ")[0];

/** Plain-language status of the ride for one event occurrence. */
export function rideStatus(o: Occurrence, meId: string): { text: string; tone: "ok" | "mine" | "open" | "none" } | null {
  if (!o.event.needs_ride) return null;
  const r = o.ride;
  if (!r) return { text: "No ride yet", tone: "none" };
  if (r.driver_id === meId) return { text: `You drive · ${r.seats} free seat${r.seats === 1 ? "" : "s"}`, tone: "mine" };
  if (r.status === "confirmed") return { text: `Ride ✓ · ${first(r.driverName)} drives`, tone: "ok" };
  return { text: `${first(r.driverName)} offers ${r.seats} seat${r.seats === 1 ? "" : "s"}`, tone: "open" };
}

export function RideChip({ o, meId }: { o: Occurrence; meId: string }) {
  const s = rideStatus(o, meId);
  if (!s) return null;
  const cls = {
    ok: "bg-ok-bg text-ok",
    mine: "bg-p500 text-white",
    open: "bg-cream text-olive",
    none: "bg-canvas text-ink-3",
  }[s.tone];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{s.text}</span>;
}

export const Icons = {
  car: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 16l1.6-5.2A2 2 0 0 1 8.5 9.4h7a2 2 0 0 1 1.9 1.4L19 16" /><rect x="3.5" y="15" width="17" height="4" rx="1.5" /><circle cx="7.5" cy="19.5" r="1.2" /><circle cx="16.5" cy="19.5" r="1.2" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  ),
  group: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.5a6.5 6.5 0 0 1 3 5.5" />
    </svg>
  ),
  child: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="6.5" r="3" /><path d="M7 21v-5l-2-3 4-2h6l4 2-2 3v5" />
    </svg>
  ),
  tag: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" /><circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  ),
};
