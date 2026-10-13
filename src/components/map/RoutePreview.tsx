"use client";

import { directionsUrl, distanceKm, hasCoords, type LatLng } from "@/lib/geo";
import { LeafletMap, type MapMarker } from "./LeafletMap";

type Stop = (LatLng & { label: string }) | null | undefined;

/** Small map: pick-up point(s) → event place, with distance and a directions link. */
export function RoutePreview({ pickups, place, height = "h-[200px]" }: { pickups: Stop[]; place: Stop; height?: string }) {
  const starts = pickups.filter((p): p is LatLng & { label: string } => hasCoords(p));
  const end = hasCoords(place) ? place : null;
  if (!starts.length && !end) return null;

  const markers: MapMarker[] = [
    ...starts.map((p, i) => ({ ...p, tone: "start" as const, text: starts.length > 1 ? String(i + 1) : "P" })),
    ...(end ? [{ ...end, tone: "end" as const, text: "★" }] : []),
  ];
  const one = starts.length === 1 && end;

  return (
    <div className="flex flex-col gap-2">
      <LeafletMap className={`${height} w-full`} markers={markers} line={!!one} label="Route preview map" />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-3">
        {starts.length > 0 && <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-full bg-ok" />Pick-up</span>}
        {end && <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-full bg-p500" />{end.label}</span>}
        {one && <span>about {distanceKm(starts[0], end).toFixed(1)} km</span>}
        {end && (
          <a href={directionsUrl(end, starts[0])} target="_blank" rel="noreferrer" className="ml-auto font-semibold text-p500 no-underline hover:text-p600">
            Directions ↗
          </a>
        )}
      </div>
    </div>
  );
}
