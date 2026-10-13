/** "+36301234567" / "06 30 123 4567" → "+36 30 123 4567". Other formats are kept as typed. */
export function formatHu(raw: string): string {
  const v = String(raw ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
  if (!v) return "";
  let d = v.replace(/[^\d+]/g, "");
  if (d.startsWith("06")) d = "+36" + d.slice(2);
  if (/^\+36\d{8,9}$/.test(d)) {
    const n = d.slice(3);
    const area = n.startsWith("1") ? 1 : 2;
    const rest = n.slice(area);
    return `+36 ${n.slice(0, area)} ${rest.slice(0, 3)} ${rest.slice(3)}`;
  }
  return v;
}
