import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const NAV = [
  { href: "/#advantages", label: "Advantages" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#trust", label: "Trust" },
  { href: "/#team", label: "Team" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/[.08] bg-[rgba(21,8,48,.94)] backdrop-blur-[14px]">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3.5 sm:gap-6 sm:px-6">
        <Logo tone="dark" />
        <nav aria-label="Main" className="hidden items-center gap-8 text-[15px] font-semibold min-[880px]:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-white no-underline hover:text-[#c9bcf2]">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          <Link href="/login" className="whitespace-nowrap px-2 py-3 text-[15px] font-semibold text-white no-underline hover:text-[#c9bcf2] sm:px-3">
            Log in
          </Link>
          <Link
            href="/signup"
            className="btn-lift inline-flex min-h-11 items-center whitespace-nowrap rounded-full bg-white px-4 sm:px-[22px] text-[15px] font-bold text-p600 no-underline hover:bg-p100 hover:text-p700"
          >
            Try it for free
          </Link>
        </div>
      </div>
    </header>
  );
}
