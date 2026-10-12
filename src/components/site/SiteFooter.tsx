import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const linkCls = "text-on-dark no-underline hover:text-white";
const heading = "text-[13px] font-bold uppercase tracking-[1.2px] text-white";

export function SiteFooter() {
  return (
    <footer id="contact" className="bg-p700 px-6 pt-[72px] pb-8 text-white">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-12">
        <div className="grid gap-10 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
          <div className="flex flex-col gap-4">
            <Logo tone="dark" href={null} />
            <p className="m-0 max-w-[280px] text-[15px] leading-relaxed text-on-dark">
              Car pooling for kids&apos; activities — shared rides between parents you trust.
            </p>
          </div>
          <nav aria-label="Product" className="flex flex-col gap-3 text-[15px]">
            <span className={heading}>Product</span>
            <Link className={linkCls} href="/#advantages">Advantages</Link>
            <Link className={linkCls} href="/#pricing">Pricing</Link>
            <Link className={linkCls} href="/#trust">Trust &amp; safety</Link>
            <Link className={linkCls} href="/#team">Team</Link>
          </nav>
          <nav aria-label="Legal" className="flex flex-col gap-3 text-[15px]">
            <span className={heading}>Legal</span>
            <Link className={linkCls} href="/privacy">Privacy policy</Link>
            <Link className={linkCls} href="/terms">Terms of use</Link>
            <Link className={linkCls} href="/imprint">Imprint</Link>
          </nav>
          <div className="flex flex-col gap-3 text-[15px]">
            <span className={heading}>Contact</span>
            <a className={linkCls} href="mailto:support@thalassa-consulting.com">support@thalassa-consulting.com</a>
            <address className="not-italic leading-relaxed text-on-dark">
              Thalassa Consulting Kft.<br />Dózsa György út 37<br />1188 Budapest, Hungary
            </address>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-4 border-t border-white/[.12] pt-6 text-[13px] text-on-dark-2">
          <span>© 2026 SharePa. All rights reserved.</span>
          <span>Made with care for busy parents.</span>
        </div>
      </div>
    </footer>
  );
}
