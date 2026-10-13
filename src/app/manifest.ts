import type { MetadataRoute } from "next";

/** Makes SharePa installable ("Add to Home Screen"); opens straight into the app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app",
    name: "SharePa – share the school run",
    short_name: "SharePa",
    description: "Car-pool school runs and kids' activities with parents you trust.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f3f3f5",
    theme_color: "#5833A7",
    categories: ["lifestyle", "productivity", "travel"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
