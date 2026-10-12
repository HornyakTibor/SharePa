import Link from "next/link";
import { Logo } from "./Logo";

/** Centered card on the brand gradient, used by Log in and Create account. */
export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[linear-gradient(180deg,#E3DEF7_0%,#ECE9F6_45%,#f3f3f5_100%)] px-4 py-12">
      <Logo tone="light" />
      <div className="w-full max-w-[440px] rounded-[28px] bg-white p-8 shadow-[0_12px_40px_rgba(9,16,29,.08)] sm:p-10">
        <h1 className="m-0 text-[28px] leading-tight font-extrabold tracking-[-0.5px] text-navy">{title}</h1>
        <div className="mt-4 flex flex-col gap-4 text-body">{children}</div>
      </div>
      <Link href="/" className="text-sm font-semibold text-p500 no-underline hover:text-p600">← Back to the website</Link>
    </main>
  );
}
