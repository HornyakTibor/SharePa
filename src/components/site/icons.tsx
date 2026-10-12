// Stroke icons used on the website, copied from the SharePa design.
type P = { className?: string; color?: string; width?: number };

const base = (w = 2) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  strokeWidth: w,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const Check = ({ className = "h-[18px] w-[18px] shrink-0", color = "#5833A7", width = 2.4 }: P) => (
  <svg {...base(width)} stroke={color} className={className}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const Arrow = ({ className = "h-[18px] w-[18px]" }: P) => (
  <svg {...base(2.4)} stroke="currentColor" className={className}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const Soccer = ({ className = "h-[22px] w-[22px]" }: P) => (
  <svg {...base()} stroke="#fff" className={className}><circle cx="12" cy="12" r="9" /><path d="M12 3l2.6 4.5h-5.2L12 3zM4 10l4.6 1.4M20 10l-4.6 1.4M8 20l1.4-4.6M16 20l-1.4-4.6" /></svg>
);
export const Music = ({ className = "h-[22px] w-[22px]" }: P) => (
  <svg {...base()} stroke="#fff" className={className}><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></svg>
);
export const Gift = ({ className = "h-[22px] w-[22px]" }: P) => (
  <svg {...base()} stroke="#fff" className={className}><rect x="3.5" y="8" width="17" height="4" rx="1" /><path d="M5 12v8h14v-8M12 8v12" /><path d="M12 8c-1.5-3.5-5-3.5-5-1.5S10 8 12 8zM12 8c1.5-3.5 5-3.5 5-1.5S14 8 12 8z" /></svg>
);
export const Globe = ({ color = "#5833A7" }: P) => (
  <svg {...base()} stroke={color} className="h-6 w-6"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>
);
export const People = ({ color = "#8E4A68" }: P) => (
  <svg {...base()} stroke={color} className="h-6 w-6"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.5a6.5 6.5 0 0 1 3 5.5" /></svg>
);
export const Download = ({ color = "#6B6212" }: P) => (
  <svg {...base()} stroke={color} className="h-6 w-6"><path d="M12 3v12M7 10l5 5 5-5" /><path d="M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17" /></svg>
);
export const Shield = ({ color = "#5833A7" }: P) => (
  <svg {...base()} stroke={color} className="h-6 w-6"><path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6L12 3z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></svg>
);
