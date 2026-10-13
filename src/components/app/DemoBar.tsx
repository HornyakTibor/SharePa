"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { startTour } from "./Tour";

const pill = "min-h-10 cursor-pointer rounded-full border-0 px-4 text-sm font-bold transition-colors disabled:cursor-wait disabled:opacity-60";

/** The purple demo bar: who you are, a guided tour, and "Start fresh". */
export function DemoBar({ name }: { name: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const reset = () =>
    start(async () => {
      const { data, error } = await createClient().rpc("reset_my_demo");
      setConfirming(false);
      if (error) setMsg("Couldn’t reset the demo. Please try again.");
      else if (data === "recent") setMsg("The demo was reset less than a minute ago — it’s already fresh.");
      else {
        setMsg("Fresh start: Kata’s week is back to its original state.");
        router.refresh();
      }
    });

  return (
    <div role="note" className="flex flex-wrap items-center gap-3 rounded-[20px] bg-[linear-gradient(95deg,#150830_0%,#341C67_50%,#5833A7_100%)] px-5 py-4 text-white">
      <span className="rounded-full bg-yellow px-2.5 py-1 text-xs font-bold text-p700">Demo</span>
      <p className="m-0 min-w-[220px] grow text-sm">
        {msg ?? (
          <>
            You&apos;re exploring SharePa as <b>{name}</b>, a sample parent. Everything resets every night, so feel free to click around.
          </>
        )}
      </p>
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">Undo every change in the demo?</span>
          <button type="button" disabled={pending} onClick={reset} className={`${pill} bg-white text-p600 hover:bg-p100`}>
            {pending ? "Resetting…" : "Yes, start fresh"}
          </button>
          <button type="button" disabled={pending} onClick={() => setConfirming(false)} className={`${pill} bg-white/10 text-white hover:bg-white/20`}>
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={startTour} className={`${pill} bg-white text-p600 hover:bg-p100`}>
            Take the tour
          </button>
          <button type="button" onClick={() => { setMsg(null); setConfirming(true); }} className={`${pill} bg-white/10 text-white hover:bg-white/20`}>
            Start fresh
          </button>
        </div>
      )}
    </div>
  );
}
