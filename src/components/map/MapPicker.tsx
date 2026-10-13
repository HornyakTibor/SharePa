"use client";

import { useEffect, useRef, useState } from "react";
import { BUDAPEST, hasCoords, reversePlace, searchPlaces, type LatLng, type Place } from "@/lib/geo";
import { LeafletMap } from "./LeafletMap";

export type PlaceValue = { address: string; lat?: number | null; lng?: number | null };

const PinIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

/** Text input with a "Select from map" button. Keeps the address text and its coordinates together. */
export function AddressField({
  label,
  value,
  onChange,
  name,
  placeholder,
  required,
  inputClassName,
  title = "Select from map",
}: {
  label?: string;
  value: PlaceValue;
  onChange: (v: PlaceValue) => void;
  name?: string;
  placeholder?: string;
  required?: boolean;
  inputClassName: string;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const field = (
    <span className="relative flex min-w-0">
      <input
        className={`${inputClassName} pr-14`}
        value={value.address}
        placeholder={placeholder}
        required={required}
        aria-label={label ? undefined : placeholder}
        // Typing a new address forgets the old map point.
        onChange={(e) => onChange({ address: e.target.value, lat: null, lng: null })}
      />
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={title}
        title={title}
        className={`absolute top-1/2 right-1.5 grid h-9 w-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-0 transition-colors ${hasCoords(value) ? "bg-p500 text-white hover:bg-p600" : "bg-white text-p500 hover:bg-p100"}`}
      >
        <PinIcon />
      </button>
    </span>
  );
  return (
    <>
      {label ? (
        <label className="flex min-w-0 flex-col gap-2 text-sm font-semibold text-ink-2">
          {label}
          {field}
          {hasCoords(value) && <span className="text-xs font-normal text-ok">Pinned on the map</span>}
        </label>
      ) : (
        field
      )}
      {name && (
        <>
          <input type="hidden" name={name} value={value.address} />
          <input type="hidden" name={`${name}Lat`} value={value.lat ?? ""} />
          <input type="hidden" name={`${name}Lng`} value={value.lng ?? ""} />
        </>
      )}
      {open && <MapPicker initial={value} title={title} onClose={() => setOpen(false)} onPick={(p) => onChange(p)} />}
    </>
  );
}

/** Dialog: search for an address or click the map, then "Use this place". */
export function MapPicker({
  initial,
  title,
  onClose,
  onPick,
}: {
  initial: PlaceValue;
  title: string;
  onClose: () => void;
  onPick: (p: Place) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState(initial.address);
  const [results, setResults] = useState<Place[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sel, setSel] = useState<Place | null>(hasCoords(initial) ? { address: initial.address, lat: initial.lat!, lng: initial.lng! } : null);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  // Search as you type (pauses, so the free service isn't flooded).
  useEffect(() => {
    if (q.trim().length < 3 || q === sel?.address) {
      setResults(null);
      return;
    }
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      setBusy(true);
      setErr("");
      try {
        setResults(await searchPlaces(q, sel ?? BUDAPEST, ctl.signal));
      } catch {
        if (!ctl.signal.aborted) setErr("Search isn't available right now. Click the map instead.");
      } finally {
        setBusy(false);
      }
    }, 450);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [q, sel]);

  const clickMap = async (at: LatLng) => {
    setSel({ ...at, address: "Finding the address…" });
    const p = await reversePlace(at);
    setSel(p);
    setQ(p.address);
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="map-title"
      className="m-auto w-[min(720px,calc(100vw-24px))] max-h-[calc(100dvh-24px)] overflow-y-auto rounded-[28px] border-0 bg-white p-0 text-ink shadow-[0_24px_64px_rgba(9,16,29,.32)] backdrop:bg-[rgba(21,8,48,.35)] backdrop:backdrop-blur-[3px]"
    >
      <div className="flex flex-col gap-4 p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-[.08em] text-ink-3">Search or click the map</p>
            <h2 id="map-title" className="mt-1 mb-0 text-2xl font-bold text-navy">{title}</h2>
          </div>
          <button type="button" aria-label="Close" onClick={() => ref.current?.close()} className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-canvas text-ink-2 hover:bg-p100">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
          </button>
        </div>
        <div className="relative">
          <input
            autoFocus
            type="search"
            aria-label="Search for an address or place"
            placeholder="e.g. Komjádi pool or Bartók Béla út 152"
            className="min-h-12 w-full rounded-2xl border-0 bg-canvas px-4 text-base font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink-3 focus:bg-white focus:shadow-[inset_0_0_0_2px_#5833A7] focus:ring-4 focus:ring-p100"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {(results?.length || busy || err) && (
            <ul aria-live="polite" className="absolute inset-x-0 top-[calc(100%+6px)] z-[1000] m-0 flex list-none flex-col rounded-2xl bg-white p-1.5 shadow-[0_12px_32px_rgba(9,16,29,.24)]">
              {busy && <li className="px-3 py-2 text-sm text-ink-3">Searching…</li>}
              {err && <li className="px-3 py-2 text-sm text-err">{err}</li>}
              {!busy &&
                results?.map((r, i) => (
                  <li key={`${r.lat},${r.lng},${i}`}>
                    <button
                      type="button"
                      onClick={() => { setSel(r); setQ(r.address); setResults(null); }}
                      className="flex w-full cursor-pointer items-start gap-2.5 rounded-xl border-0 bg-transparent px-3 py-2 text-left text-sm text-ink hover:bg-p100"
                    >
                      <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-p500" />
                      {r.address}
                    </button>
                  </li>
                ))}
              {!busy && results?.length === 0 && !err && <li className="px-3 py-2 text-sm text-ink-3">No places found. Try a street name, or click the map.</li>}
            </ul>
          )}
        </div>
        <LeafletMap
          className="h-[min(420px,50dvh)] w-full cursor-crosshair"
          label="Map – click to choose a place"
          center={sel ?? BUDAPEST}
          markers={sel ? [{ lat: sel.lat, lng: sel.lng, tone: "end", label: sel.address }] : []}
          onPick={clickMap}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 min-w-0 grow text-sm text-ink-2">
            {sel ? <><b className="text-navy">Selected:</b> {sel.address}</> : "Nothing selected yet."}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => ref.current?.close()} className="min-h-11 cursor-pointer rounded-full border-0 bg-transparent px-5 text-sm font-bold text-p500 hover:bg-p100">Cancel</button>
            <button
              type="button"
              disabled={!sel || sel.address === "Finding the address…"}
              onClick={() => { if (sel) onPick(sel); ref.current?.close(); }}
              className="min-h-11 cursor-pointer rounded-full border-0 bg-p500 px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(88,51,167,.24)] hover:bg-p600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Use this place
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
