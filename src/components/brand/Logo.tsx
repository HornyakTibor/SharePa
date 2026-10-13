import Link from "next/link";

/** The SharePa mark: three stacked lanes on a purple tile (also the app icon and favicon). */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={`shrink-0 ${className}`} fill="none" aria-hidden="true">
      <rect width="36" height="36" rx="4" fill="#5833A7" />
      <path d="M7 14C7 10.6863 9.68629 8 13 8H29C29 11.3137 26.3137 14 23 14H7Z" fill="#E2DCF3" />
      <path opacity="0.66" d="M7 15H23C26.3137 15 29 17.6863 29 21H13C9.68629 21 7 18.3137 7 15Z" fill="#E2DCF3" />
      <path opacity="0.33" d="M7 28C7 24.6863 9.68629 22 13 22H29C29 25.3137 26.3137 28 23 28H7Z" fill="#E2DCF3" />
    </svg>
  );
}

/** Logo lockup. `tone="dark"` sits on the dark purple header and footer; `tone="light"` on white. */
export function Logo({ tone = "dark", href = "/" }: { tone?: "dark" | "light"; href?: string | null }) {
  const content = (
    <>
      <LogoMark />
      <span className={`text-[22px] font-extrabold tracking-[-0.5px] ${tone === "dark" ? "text-white" : "text-navy"}`}>
        Share<span className={tone === "dark" ? "text-lavender" : "text-p500"}>Pa</span>
      </span>
    </>
  );
  if (href === null) return <span className="flex items-center gap-2.5">{content}</span>;
  return (
    <Link href={href} aria-label="SharePa home" className="flex items-center gap-2.5 no-underline">
      {content}
    </Link>
  );
}
