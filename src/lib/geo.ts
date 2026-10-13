// Address search and "what's here?" lookups with Photon (free, OpenStreetMap data), biased to Budapest.

export type LatLng = { lat: number; lng: number };
export type Place = LatLng & { address: string; name?: string };

export const BUDAPEST: LatLng = { lat: 47.4979, lng: 19.0402 };
const PHOTON = "https://photon.komoot.io";

type Feature = {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    district?: string;
    locality?: string;
    country?: string;
    type?: string;
  };
};

/** "Komjádi pool, Árpád fejedelem útja 8, 1023 Budapest" style labels. */
function label(p: Feature["properties"]): { address: string; name?: string } {
  const street = [p.street, p.housenumber].filter(Boolean).join(" ");
  const city = [p.postcode, p.city ?? p.locality].filter(Boolean).join(" ");
  const name = p.name && p.name !== street && p.type !== "house" && p.type !== "street" ? p.name : undefined;
  const parts = [name, street || (!name ? p.name : undefined), city].filter(Boolean);
  return { address: [...new Set(parts)].join(", ") || "Selected point", name };
}

const toPlace = (f: Feature): Place => ({ lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0], ...label(f.properties) });

export async function searchPlaces(q: string, near: LatLng = BUDAPEST, signal?: AbortSignal): Promise<Place[]> {
  const query = q.trim();
  if (query.length < 3) return [];
  const url = `${PHOTON}/api/?q=${encodeURIComponent(query)}&lat=${near.lat}&lon=${near.lng}&limit=6&lang=en`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("search failed");
  const data: { features: Feature[] } = await res.json();
  return data.features.map(toPlace);
}

export async function reversePlace(at: LatLng, signal?: AbortSignal): Promise<Place> {
  try {
    const res = await fetch(`${PHOTON}/reverse?lat=${at.lat}&lon=${at.lng}&lang=en`, { signal });
    if (res.ok) {
      const data: { features: Feature[] } = await res.json();
      if (data.features[0]) return { ...toPlace(data.features[0]), lat: at.lat, lng: at.lng };
    }
  } catch {
    /* fall through to a plain label */
  }
  return { ...at, address: `${at.lat.toFixed(5)}, ${at.lng.toFixed(5)}` };
}

export const hasCoords = (p: { lat?: number | null; lng?: number | null } | null | undefined): p is LatLng =>
  !!p && typeof p.lat === "number" && typeof p.lng === "number";

/** Straight-line distance in km (good enough for "about 3 km away"). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Opens directions in the parent's own maps app. */
export const directionsUrl = (to: LatLng, from?: LatLng) =>
  `https://www.google.com/maps/dir/?api=1${from ? `&origin=${from.lat},${from.lng}` : ""}&destination=${to.lat},${to.lng}`;
