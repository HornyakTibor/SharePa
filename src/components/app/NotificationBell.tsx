"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { markNotificationsRead, offerFromRequest } from "@/app/app/actions";
import type { Notification } from "@/lib/data/home";

// Border colours from the prototype: dark for requests, green for good news, red-brown for "ride found elsewhere".
const KIND: Record<Notification["kind"], { border: string; icon: React.ReactNode }> = {
  request: { border: "#150830", icon: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /> },
  seats: { border: "#150830", icon: <path d="M18.92 6.01A1.5 1.5 0 0 0 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-8l-2.08-5.99zM6.5 16a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm11 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM5 11l1.5-4.5h11L19 11H5z" /> },
  offer: { border: "#1b5e20", icon: <path d="M18.92 6.01A1.5 1.5 0 0 0 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-8l-2.08-5.99zM6.5 16a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm11 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM5 11l1.5-4.5h11L19 11H5z" /> },
  confirmed: { border: "#1b5e20", icon: <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /> },
  friend: { border: "#5833a7", icon: <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /> },
  declined: { border: "#8e1b1b", icon: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /> },
};

function ago(iso: string) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

export function NotificationBell({ notifications }: { notifications: Notification[] }) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    if (unread) start(() => markNotificationsRead());
    const close = (e: Event) => {
      if (panel.current?.contains(e.target as Node) || btn.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btn.current?.focus();
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
    // Mark as read once per opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const offer = (id: string) => {
    setBusy(id);
    start(async () => {
      const res = await offerFromRequest(id);
      setBusy(null);
      setToast(res.ok ? res.message : res.error);
    });
  };

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
        className={`relative grid h-10 w-10 cursor-pointer place-items-center rounded-full border-0 ${open ? "bg-p100 text-p500" : "bg-transparent text-ink-2 hover:bg-p100 hover:text-p500"}`}
      >
        <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden="true">
          <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
        </svg>
        {unread > 0 && (
          <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-err px-1 text-[11px] font-bold text-white ring-2 ring-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panel}
          tabIndex={-1}
          role="dialog"
          aria-label="Notifications"
          className="fixed top-[68px] right-3 z-50 flex max-h-[min(640px,calc(100dvh-84px))] w-[min(400px,calc(100vw-24px))] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_12px_32px_rgba(9,16,29,.24)] outline-none"
        >
          <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
            <h2 className="m-0 text-lg font-semibold text-navy">Notifications</h2>
            <Link href="/app/profile#device" onClick={() => setOpen(false)} className="text-xs font-semibold text-p500 no-underline hover:text-p600">
              Get them on your phone
            </Link>
          </div>
          <div className="flex flex-col gap-2.5 overflow-y-auto p-3" aria-live="polite">
            {notifications.length === 0 && (
              <p className="m-0 px-3 py-8 text-center text-sm text-ink-3">
                Nothing yet. When you ask friends for a ride or offer seats, their answers appear here.
              </p>
            )}
            {notifications.map((n) => {
              const k = KIND[n.kind];
              return (
                <article
                  key={n.id}
                  className="flex gap-3 rounded-[18px] bg-p500 p-3.5 text-white"
                  style={{ boxShadow: `inset 0 0 0 3px ${k.border}`, opacity: n.read ? 0.82 : 1 }}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white" style={{ background: k.border }}>
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">{k.icon}</svg>
                  </span>
                  <div className="flex min-w-0 grow flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <b className="text-[15px]">
                        {!n.read && <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-yellow align-middle" aria-label="New" />}
                        {n.title}
                      </b>
                      <span className="shrink-0 text-xs opacity-75">{ago(n.createdAt)}</span>
                    </div>
                    <p className="m-0 text-[13px] leading-snug text-white/90">{n.body}</p>
                    {n.kind === "offer" && n.eventId && n.rideDate && (
                      <div className="pt-1.5">
                        <Link
                          href={`/app?view=list&offers=${n.eventId}_${n.rideDate}`}
                          onClick={() => setOpen(false)}
                          className="inline-flex h-[34px] items-center rounded-full bg-white px-3.5 text-[13px] font-semibold text-p500 no-underline hover:brightness-95"
                        >
                          See offers
                        </Link>
                      </div>
                    )}
                    {n.kind === "request" && (
                      <div className="pt-1.5">
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() => offer(n.id)}
                          className="h-[34px] cursor-pointer rounded-full border-0 bg-white px-3.5 text-[13px] font-semibold text-p500 hover:brightness-95 disabled:cursor-wait disabled:opacity-60"
                        >
                          {busy === n.id ? "Sending…" : "I can drive"}
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-p700 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(9,16,29,.24)]">
          {toast}
        </div>
      )}
    </>
  );
}
