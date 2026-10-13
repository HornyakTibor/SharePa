"use client";

import { useEffect, useState, useTransition } from "react";
import QRCode from "qrcode";
import { addFriend, searchParents } from "@/app/app/setup/actions";
import { Avatar } from "@/components/app/Avatar";
import { btn, cx, inputCls, useSetupAction } from "./ui";

type Result = { id: string; name: string; isFriend: boolean };

export function StepFriends({
  friendCount,
  inviteCode,
  isDemo,
  firstName,
}: {
  friendCount: number;
  inviteCode: string;
  isDemo: boolean;
  firstName: string;
}) {
  const [tab, setTab] = useState<"search" | "invite">("search");
  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="Add friends" className="inline-flex gap-1 self-start rounded-full bg-canvas p-1">
        {(["search", "invite"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cx("min-h-10 cursor-pointer rounded-full border-0 px-5 text-sm font-bold capitalize", tab === t ? "bg-white text-p600 shadow-[0_1px_3px_rgba(10,15,28,.12)]" : "bg-transparent text-ink-3 hover:text-ink")}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "search" ? <Search isDemo={isDemo} /> : <Invite code={inviteCode} isDemo={isDemo} firstName={firstName} />}
      <p className="m-0 text-sm text-ink-3">{friendCount} friend{friendCount === 1 ? "" : "s"} added.</p>
    </div>
  );
}

function Search({ isDemo }: { isDemo: boolean }) {
  const { pending, run, toast } = useSetupAction();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [searching, start] = useTransition();

  useEffect(() => {
    if (q.trim().length < 2) { setResults(null); return; }
    const t = setTimeout(() => start(async () => setResults(await searchParents(q))), 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="flex flex-col gap-3">
      <input
        className={inputCls}
        type="search"
        placeholder={isDemo ? "Try “Dávid”, “Nóra” or “Tamás”" : "Search by name or email address"}
        aria-label="Search parents"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div aria-live="polite">
        {results === null ? (
          <p className="m-0 text-sm text-ink-3">Type at least 2 letters of a parent’s name, or their full email address.</p>
        ) : results.length ? (
          <ul className={cx("m-0 flex list-none flex-col p-0", searching && "opacity-60")}>
            {results.map((p) => (
              <li key={p.id} className="flex items-center gap-3 border-t border-black/5 py-3 first:border-t-0">
                <Avatar name={p.name} />
                <div className="flex min-w-0 grow flex-col"><b className="text-ink">{p.name}</b><span className="text-sm text-ink-3">Parent on SharePa</span></div>
                {p.isFriend ? (
                  <span className="rounded-full bg-ok-bg px-3 py-1 text-xs font-bold text-ok">Added</span>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => addFriend(p.id), (r) => r.ok && setResults((rs) => rs?.map((x) => (x.id === p.id ? { ...x, isFriend: true } : x)) ?? null))}
                    className={cx(btn.base, btn.sec, btn.sm)}
                  >
                    + Add
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 rounded-2xl bg-canvas px-4 py-4 text-sm text-ink-3">{searching ? "Searching…" : "No parents found. Try inviting them."}</p>
        )}
      </div>
      {toast}
    </div>
  );
}

function Invite({ code, isDemo, firstName }: { code: string; isDemo: boolean; firstName: string }) {
  const [origin, setOrigin] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const { toast, say } = useSetupAction();
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    setOrigin(window.location.origin);
    setCanShare("share" in navigator);
  }, []);
  const link = origin ? `${origin}/signup?invite=${code}` : "";

  useEffect(() => {
    if (showQr && link && !qr) QRCode.toString(link, { type: "svg", margin: 1, color: { dark: "#150830", light: "#ffffff" } }).then(setQr);
  }, [showQr, link, qr]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      say("Invite link copied.");
    } catch {
      say("Couldn’t copy. Select the link and copy it by hand.", true);
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title: "Join me on SharePa", text: `${firstName} invites you to share school runs on SharePa.`, url: link });
    } catch {
      /* the parent closed the share sheet */
    }
  };

  if (isDemo) {
    return (
      <p className="m-0 rounded-2xl bg-canvas px-4 py-4 text-sm text-ink-2">
        <b className="text-ink">Invites are switched off in the demo.</b> With your own account you get a personal invite link and QR code. Parents who sign up with it become your friends automatically.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-sm text-ink-2">Send this link to a parent. When they sign up with it, you become friends automatically.</p>
      <div className="flex flex-wrap items-center gap-3 rounded-[20px] border-2 border-dashed border-[#e3e5e8] px-4 py-3">
        <code className="min-w-0 grow font-mono text-[13px] text-ink [overflow-wrap:anywhere]">{link || "…"}</code>
        <button type="button" onClick={copy} className={cx(btn.base, btn.pri, btn.sm)}>Copy link</button>
        {canShare && (
          <button type="button" onClick={share} className={cx(btn.base, btn.sec, btn.sm)}>Share…</button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setShowQr(!showQr)} className={cx(btn.base, btn.sec, btn.sm)}>{showQr ? "Hide QR code" : "Show QR code"}</button>
        <span className="text-sm text-ink-3">Let a parent scan it at pick-up.</span>
      </div>
      {showQr && (
        <div
          role="img"
          aria-label="Invite QR code"
          className="h-[200px] w-[200px] rounded-2xl bg-white p-2 shadow-[0_4px_16px_rgba(10,15,28,.08)] [&_svg]:h-full [&_svg]:w-full"
          dangerouslySetInnerHTML={qr ? { __html: qr } : undefined}
        />
      )}
      {toast}
    </div>
  );
}
