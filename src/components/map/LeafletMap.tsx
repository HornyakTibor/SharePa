"use client";

import { useEffect, useRef } from "react";
import type { Map as LMap, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";
import { BUDAPEST, type LatLng } from "@/lib/geo";

export type MapMarker = LatLng & { label?: string; tone?: "start" | "end" | "pin" | "muted"; text?: string };

const TONES = {
  start: { bg: "#1b5e20", fg: "#ffffff" },
  end: { bg: "#5833a7", fg: "#ffffff" },
  pin: { bg: "#150830", fg: "#ffffff" },
  muted: { bg: "#ffffff", fg: "#5833a7" },
};

/**
 * A light Leaflet map (CARTO Positron tiles, OpenStreetMap data).
 * Markers are round pins with an optional letter; `line` joins them with a dashed route line.
 */
export function LeafletMap({
  markers = [],
  line = false,
  onPick,
  center,
  zoom = 13,
  className = "",
  label = "Map",
}: {
  markers?: MapMarker[];
  line?: boolean;
  onPick?: (at: LatLng) => void;
  center?: LatLng;
  zoom?: number;
  className?: string;
  label?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const pick = useRef(onPick);
  pick.current = onPick;

  // Create the map once (Leaflet needs the browser, so it's loaded here).
  useEffect(() => {
    let cancelled = false;
    let instance: LMap | null = null;
    let ro: ResizeObserver | null = null;
    import("leaflet").then((L) => {
      if (cancelled || !box.current) return;
      instance = L.map(box.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false }).setView(
        [(center ?? BUDAPEST).lat, (center ?? BUDAPEST).lng],
        zoom,
      );
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(instance);
      instance.on("click", (e) => pick.current?.({ lat: e.latlng.lat, lng: e.latlng.lng }));
      layer.current = L.layerGroup().addTo(instance);
      map.current = instance;
      draw(L);
      // Dialogs and tabs change the map's size after it was created.
      ro = new ResizeObserver(() => instance?.invalidateSize());
      ro.observe(box.current);
    });
    return () => {
      cancelled = true;
      ro?.disconnect();
      instance?.remove();
      map.current = null;
      layer.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const key = JSON.stringify([markers, line]);
  useEffect(() => {
    if (map.current) import("leaflet").then(draw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  function draw(L: typeof import("leaflet")) {
    const m = map.current;
    const g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    markers.forEach((p) => {
      const t = TONES[p.tone ?? "pin"];
      const icon = L.divIcon({
        className: "",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        html: `<span style="display:grid;place-items:center;width:30px;height:30px;border-radius:999px;background:${t.bg};color:${t.fg};font:700 13px Montserrat,sans-serif;box-shadow:0 0 0 3px #fff,0 4px 12px rgba(9,16,29,.3)">${p.text ?? ""}</span>`,
      });
      const mk = L.marker([p.lat, p.lng], { icon, keyboard: false, title: p.label });
      if (p.label) mk.bindTooltip(p.label, { direction: "top", offset: [0, -14] });
      mk.addTo(g);
    });
    if (line && markers.length > 1) {
      L.polyline(
        markers.map((p) => [p.lat, p.lng] as [number, number]),
        { color: "#5833a7", weight: 4, opacity: 0.8, dashArray: "2 8", lineCap: "round" },
      ).addTo(g);
    }
    if (markers.length > 1) m.fitBounds(L.latLngBounds(markers.map((p) => [p.lat, p.lng] as [number, number])), { padding: [36, 36], maxZoom: 15 });
    else if (markers.length === 1) m.setView([markers[0].lat, markers[0].lng], Math.max(m.getZoom(), 15));
  }

  return <div ref={box} role="region" aria-label={label} className={`isolate z-0 overflow-hidden rounded-2xl bg-canvas ${className}`} />;
}
