"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { acceptOffer } from "@/app/app/actions";
import { Avatar } from "./Avatar";
import { RoutePreview } from "@/components/map/RoutePreview";
import type { LatLng } from "@/lib/geo";

export type Offer = {
  id: string;
  driverName: string;
  seats: number;
  pickup: string | null;
  pickupTime: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
};
type Place = (LatLng & { label: string }) | null;

/** "See offers (2)" — opens the prototype's Driving offers list, where the parent approves one. */
export function OffersButton({
  offers,
  place = null,
  title,
  when,
  kids,
  compact = false,
  autoOpen = false,
}: {
  offers: Offer[];
  place?: Place;
  title: string;
  when: string;
  kids: string;
  compact?: boolean;
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(autoOpen);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border-0 bg-ok font-semibold text-white hover:brightness-110 ${
          compact ? "w-full px-2 py-1.5 text-[11px]" : "px-3 py-1.5 text-xs"
        }`}
      >
        <span aria-hidden="true" className="grid h-4 min-w-4 place-items-center rounded-full bg-white px-1 text-[10px] font-bold text-ok">{offers.length}</span>
        {compact ? "See offers" : `See driving offer${offers.length === 1 ? "" : "s"}`}
      </button>
      {open && (
        <OffersDialog
          offers={offers}
          place={place}
          title={title}
          when={when}
          kids={kids}
          onClose={() => {
            setOpen(false);
            if (autoOpen) {
              const url = new URL(window.location.href);
              url.searchParams.delete("offers");
              window.history.replaceState(null, "", url);
            }
          }}
          onDone={(msg) => {
            setOpen(false);
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

function OffersDialog({
  offers,
  place,
  title,
  when,
  kids,
  onClose,
  onDone,
}: {
  offers: Offer[];
  place: Place;
  title: string;
  when: string;
  kids: string;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const approve = (id: string) => {
    setError(null);
    setBusy(id);
    start(async () => {
      const res = await acceptOffer(id);
      setBusy(null);
      if (res.ok) onDone(res.message);
      else setError(res.error);
    });
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby="offers-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-auto w-[min(560px,calc(100vw-24px))] max-h-[calc(100dvh-24px)] overflow-y-auto rounded-[28px] border-0 bg-white p-0 text-ink shadow-[0_24px_64px_rgba(9,16,29,.32)] backdrop:bg-[rgba(21,8,48,.35)] backdrop:backdrop-blur-[3px]"
    >
      <div className="flex flex-col gap-5 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-[.08em] text-ink-3">
              {title} · {when}{kids ? ` · for ${kids}` : ""}
            </p>
            <h2 id="offers-title" className="mt-1 mb-0 text-2xl font-bold text-navy">Driving offers</h2>
          </div>
          <button type="button" aria-label="Close" onClick={() => ref.current?.close()} className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-canvas text-ink-2 hover:bg-p100">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
          </button>
        </div>
        <p className="m-0 text-sm text-ink-3">Pick the parent who should drive. They get a confirmation, and the others are told a ride is found.</p>
        <RoutePreview
          height="h-[200px]"
          pickups={offers.map((o) => (o.pickupLat != null && o.pickupLng != null ? { lat: o.pickupLat, lng: o.pickupLng, label: `${o.driverName}: ${o.pickup ?? "pick-up"}` } : null))}
          place={place}
        />
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {offers.map((o, i) => (
            <li key={o.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-canvas px-4 py-3 sm:flex-nowrap">
              <Avatar name={o.driverName} />
              <div className="flex min-w-0 flex-1 flex-col">
                <b className="flex items-center gap-2 text-ink">
                  {o.driverName}
                  {offers.length > 1 && o.pickupLat != null && (
                    <span aria-label={`Pin ${i + 1} on the map`} className="grid h-5 w-5 place-items-center rounded-full bg-ok text-[11px] font-bold text-white">
                      {offers.filter((x, k) => k <= i && x.pickupLat != null).length}
                    </span>
                  )}
                </b>
                <span className="text-sm text-ink-3">
                  {o.seats} free seat{o.seats === 1 ? "" : "s"}
                  {o.pickup ? ` · pick-up ${(o.pickupTime ?? "").slice(0, 5)} · ${o.pickup}` : ""}
                </span>
              </div>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => approve(o.id)}
                className="min-h-11 cursor-pointer rounded-full border-0 bg-p500 px-5 text-sm font-bold text-white hover:bg-p600 disabled:cursor-wait disabled:opacity-50"
              >
                {busy === o.id ? "Approving…" : "Approve"}
              </button>
            </li>
          ))}
        </ul>
        {error && (
          <p role="alert" className="m-0 rounded-2xl bg-err-bg px-4 py-3 text-sm font-medium text-err">
            {error}
          </p>
        )}
      </div>
    </dialog>
  );
}
