"use client";

import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const KEY = "install-hint-dismissed";

/**
 * Offers to install the app. Android/desktop Chrome: an Install button using the browser's
 * prompt. iPhone Safari (no prompt API): a one-line tip. Hidden once installed or dismissed.
 */
export function InstallHint({ appName }: { appName: string }) {
  const [mode, setMode] = useState<"prompt" | "ios" | null>(null);
  const [event, setEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const standalone =
      matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(KEY) === "1";
    } catch {
      // Storage blocked: just show it.
    }
    if (standalone || dismissed) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
      setMode("prompt");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const onInstalled = () => setMode(null);
    window.addEventListener("appinstalled", onInstalled);

    const ua = navigator.userAgent;
    const iOS = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
    if (iOS && !/CriOS|FxiOS|EdgiOS/.test(ua)) setMode("ios");

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setMode(null);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // Ignore: it simply shows again next time.
    }
  }

  if (!mode) return null;

  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-3" role="region" aria-label="Install app">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
        {mode === "prompt" ? <Download className="size-5" /> : <Share className="size-5" />}
      </div>
      <p className="min-w-0 flex-1 text-sm">
        {mode === "prompt" ? (
          <>Install {appName} on your phone to open it in one tap.</>
        ) : (
          <>
            Add {appName} to your home screen: tap <Share className="inline size-4 align-text-bottom" aria-label="Share" /> then
            &nbsp;&ldquo;Add to Home Screen&rdquo;.
          </>
        )}
      </p>
      {mode === "prompt" && event && (
        <button
          type="button"
          onClick={async () => {
            await event.prompt();
            const { outcome } = await event.userChoice;
            if (outcome === "accepted") setMode(null);
            setEvent(null);
          }}
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Install
        </button>
      )}
      <button type="button" onClick={dismiss} aria-label="Dismiss" className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-muted">
        <X className="size-4" />
      </button>
    </div>
  );
}
