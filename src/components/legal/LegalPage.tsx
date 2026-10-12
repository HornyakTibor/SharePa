import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

/** Shared frame for the legal pages: website header and footer around a readable text column. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-navy">
      <SiteHeader />
      <main className="px-6 py-16">
        <article className="legal mx-auto max-w-[760px] rounded-[28px] bg-white p-8 shadow-[0_10px_30px_rgba(26,52,83,.06)] sm:p-12">
          <p className="m-0 text-[13px] font-bold uppercase tracking-[1.6px] text-p500">Legal</p>
          <h1 className="mt-3 mb-2 text-[32px] leading-tight font-extrabold tracking-[-1px] sm:text-[40px]">{title}</h1>
          <p className="m-0 text-sm text-body">Draft · last updated {updated}</p>
          <div className="mt-8 flex flex-col gap-4 text-base leading-relaxed text-body">{children}</div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
