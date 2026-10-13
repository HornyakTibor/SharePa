"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { btn, cx } from "@/components/setup/styles";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type PushState = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function keyBytes(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;

/** Profile card: install SharePa as an app and switch push notifications on for this device. */
export function DeviceCard({ isDemo }: { isDemo: boolean }) {
  const [installEvt, setInstallEvt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [push, setPush] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    setIos(isIos());
    setInstalled(isStandalone());
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as InstallPrompt);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window) || !VAPID) {
        setPush(isIos() && !isStandalone() ? "ios-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") return setPush("denied");
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      setPush(sub ? "on" : "off");
    })();

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installEvt) return;
    await installEvt.prompt();
    const { outcome } = await installEvt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setInstallEvt(null);
  };

  const turnOn = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPush(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID) }));
      const json = sub.toJSON();
      const { error } = await createClient().rpc("save_push_subscription", {
        p_endpoint: sub.endpoint,
        p_p256dh: json.keys?.p256dh ?? "",
        p_auth: json.keys?.auth ?? "",
        p_user_agent: navigator.userAgent,
      });
      if (error) throw error;
      setPush("on");
      await sendTest(true);
    } catch {
      setMsg({ text: "Couldn’t switch notifications on in this browser. Please try again.", error: true });
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await createClient().rpc("remove_push_subscription", { p_endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setPush("off");
      setMsg({ text: "Notifications are off on this device." });
    } finally {
      setBusy(false);
    }
  };

  async function sendTest(first = false) {
    const { data, error } = await createClient().rpc("send_test_push");
    if (error || !data) setMsg({ text: "Couldn’t send a test notification.", error: true });
    else setMsg({ text: first ? "Notifications are on. A test notification is on its way." : "Test notification sent. It should arrive in a few seconds." });
  }

  return (
    <div className="mt-3 flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 py-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-semibold text-ink">SharePa app</span>
          <span className="text-xs text-ink-3">
            {installed
              ? "Installed on this device."
              : ios
                ? "On iPhone: tap Share, then “Add to Home Screen”."
                : installEvt
                  ? "Open SharePa from your home screen, like any app."
                  : "Use your browser’s menu: “Install app” or “Add to Home screen”."}
          </span>
        </div>
        {installed ? (
          <span className="rounded-full bg-ok-bg px-3 py-1 text-xs font-bold text-ok">Installed</span>
        ) : installEvt ? (
          <button type="button" onClick={install} className={cx(btn.base, btn.pri, btn.sm)}>Install app</button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-semibold text-ink">Notifications on this device</span>
          <span className="text-xs text-ink-3">
            {push === "on" && "Ride requests, offers and confirmations arrive even when SharePa is closed."}
            {push === "off" && "Get ride requests, offers and confirmations even when SharePa is closed."}
            {push === "denied" && "Blocked in this browser. Allow notifications for this site in the browser settings."}
            {push === "ios-install" && "On iPhone, add SharePa to your Home Screen first, then open it from there."}
            {push === "unsupported" && "This browser doesn’t support push notifications."}
            {push === "loading" && "Checking…"}
          </span>
          {isDemo && push !== "unsupported" && (
            <span className="mt-1 text-xs text-ink-3">Demo: only the newest browser that switches this on gets Kata’s notifications.</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {push === "off" && (
            <button type="button" disabled={busy} onClick={turnOn} className={cx(btn.base, btn.pri, btn.sm)}>{busy ? "Switching on…" : "Turn on"}</button>
          )}
          {push === "on" && (
            <>
              <button type="button" disabled={busy} onClick={() => sendTest()} className={cx(btn.base, btn.sec, btn.sm)}>Send a test</button>
              <button type="button" disabled={busy} onClick={turnOff} className={cx(btn.base, btn.ghost, btn.sm)}>Turn off</button>
            </>
          )}
        </div>
      </div>
      {msg && (
        <p role={msg.error ? "alert" : "status"} className={cx("m-0 rounded-2xl px-4 py-3 text-sm font-medium", msg.error ? "bg-err-bg text-err" : "bg-ok-bg text-ok")}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
