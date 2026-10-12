// Activity colours from the SharePa design system: text colour + soft background.
const STYLES: Record<string, { fg: string; bg: string }> = {
  Sport: { fg: "#5833a7", bg: "#e3def7" },
  Music: { fg: "#89556c", bg: "#f5eff1" },
  Art: { fg: "#645d18", bg: "#fef3a1" },
  Dance: { fg: "#6e4b8c", bg: "#f3eff7" },
  "Private teacher": { fg: "#043873", bg: "#e4ecf6" },
  Languages: { fg: "#5d3848", bg: "#e4d1d8" },
};
const OTHER = { fg: "#6d6f77", bg: "#f4f4f1" };

export function categoryStyle(category: string | null | undefined) {
  return (category && STYLES[category]) || OTHER;
}

/** "Sport · Swimming" */
export function categoryLabel(category: string | null, activity: string | null) {
  return [category, activity].filter(Boolean).join(" · ");
}
