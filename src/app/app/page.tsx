import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

// Always render per request: the page depends on who is logged in.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Home – SharePa" };

export default async function AppHome() {
  const supabase = await createClient();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  const user = data.user;
  if (!user) redirect("/login?next=/app");

  const name: string = user.user_metadata?.full_name || user.email || "there";
  const first = name.split(" ")[0];
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-white/75 backdrop-blur">
        <div className="mx-auto flex max-w-[1232px] items-center gap-4 px-4 py-3">
          <div className="mr-auto"><Logo tone="light" href="/app" /></div>
          <span className="flex items-center gap-2.5 rounded-full py-1 pr-3.5 pl-1 text-sm font-semibold text-ink-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-p500 text-[13px] font-bold text-white">{initials}</span>
            <span className="hidden sm:inline">{name}</span>
          </span>
          <form action={signOut}>
            <button className="rounded-full px-4 py-2 text-sm font-semibold text-p500 hover:bg-p100">Log out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-[1232px] px-4 py-10 sm:px-8">
        <h1 className="m-0 text-[31px] font-semibold text-navy">Hi {first}</h1>
        <p className="mt-1.5 max-w-[62ch] text-ink-2">Your SharePa account is ready.</p>
        <div className="mt-8 rounded-[28px] bg-white p-8 shadow-[0_12px_40px_rgba(9,16,29,.06)]">
          <p className="m-0 text-xs font-semibold uppercase tracking-[.08em] text-ink-3">Coming next</p>
          <h2 className="mt-2 mb-2 text-xl font-semibold text-navy">Set up your family</h2>
          <p className="m-0 text-ink-2">
            Import your calendar, add your children and invite the parents you trust. This part of SharePa is being built right now.
          </p>
        </div>
      </main>
    </div>
  );
}
