import Image from "next/image";
import Link from "next/link";
import { Logo } from "./Logo";
import { DemoButton } from "@/components/auth/DemoButton";
import kidsCar from "../../../public/images/site/ill-kids-car.webp";

/** Centered auth card on the brand gradient, as in the prototype's Log in / Create account screens. */
export function AuthShell({ title, lead, children }: { title: string; lead: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center gap-8 bg-[linear-gradient(180deg,#E3DEF7_0%,#ECE9F6_45%,#f3f3f5_100%)] px-4 py-10">
      <Logo tone="light" />
      <div className="w-full max-w-[480px] rounded-[28px] bg-white p-7 shadow-[0_12px_40px_rgba(9,16,29,.08)] sm:p-10">
        <div className="mx-auto mb-2 grid h-[170px] w-[180px] place-items-center overflow-hidden rounded-full bg-[#eeedf7]">
          <Image src={kidsCar} alt="Kids cheering in a shared car" className="h-auto w-[150px]" priority />
        </div>
        <h1 className="m-0 text-center text-[31px] leading-tight font-semibold tracking-[-0.3px] text-navy">{title}</h1>
        <p className="mt-1.5 mb-7 text-center text-ink-2">{lead}</p>
        {children}
        <div className="mt-7 flex flex-col items-center gap-3 border-t border-black/5 pt-6 text-center">
          <p className="m-0 text-sm text-ink-3">Just looking around?</p>
          <DemoButton className="btn-lift flex min-h-[52px] w-full cursor-pointer items-center justify-center rounded-full border-0 bg-white text-base font-bold text-p500 shadow-[inset_0_0_0_2px_#5833A7] hover:bg-p100 hover:text-p600">
            Try the demo as Kata
          </DemoButton>
        </div>
      </div>
      <Link href="/" className="text-sm font-semibold text-p500 no-underline hover:text-p600">
        ← Back to the website
      </Link>
    </main>
  );
}
