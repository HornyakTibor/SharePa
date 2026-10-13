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

