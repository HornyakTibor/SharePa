import Link from "next/link";

/** The SharePa car mark, drawn as a stroke icon. */
export function CarMark({ className = "h-[22px] w-[22px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 16l1.6-5.2A2 2 0 0 1 8.5 9.4h7a2 2 0 0 1 1.9 1.4L19 16" />
      <rect x="3.5" y="15" width="17" height="4" rx="1.5" />
      <circle cx="7.5" cy="19.5" r="1.2" />
      <circle cx="16.5" cy="19.5" r="1.2" />
      <path d="M9 6.5a3 3 0 0 1 6 0" />
    </svg>
  );
}

/** Logo lockup. `tone="dark"` sits on the dark purple header and footer; `tone="light"` on white. */
export function Logo({ tone = "dark", href = "/" }: { tone?: "dark" | "light"; href?: string | null }) {
  const content = (
    <>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-p500 text-white">
        <CarMark />
      </span>
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
