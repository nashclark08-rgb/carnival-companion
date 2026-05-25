"use client";

import { useEffect, useState } from "react";
import { contrastingTextColor } from "@/lib/color";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "carnival-companion:install-dismissed";

function isStandalone() {
  if (typeof window === "undefined") return false;
  const navStandalone = (window.navigator as Navigator & { standalone?: boolean })
    .standalone;
  return (
    navStandalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

function isIOS() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
}

export function InstallPrompt({ primaryColor }: { primaryColor?: string } = {}) {
  const [dismissed, setDismissed] = useState(true);
  const [ios, setIos] = useState(false);
  const [deferred, setDeferred] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) return;
    const wasDismissed =
      window.localStorage.getItem(DISMISSED_KEY) === "1";
    setDismissed(wasDismissed);
    setIos(isIOS());

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    setDismissed(true);
    window.localStorage.setItem(DISMISSED_KEY, "1");
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      dismiss();
    }
    setDeferred(null);
  }

  if (dismissed) return null;
  if (!ios && !deferred) return null;

  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm dark:border-indigo-900/60 dark:bg-indigo-950/40">
      <div className="flex-1">
        <p className="font-medium text-indigo-900 dark:text-indigo-100">
          Add Carnival to your home screen
        </p>
        <p className="mt-0.5 text-xs text-indigo-700/80 dark:text-indigo-300/80">
          {ios ? (
            <>
              Tap the <strong>Share</strong> icon (the square with the arrow) at
              the bottom of Safari, then choose <strong>Add to Home Screen</strong>.
              Lets you open the app instantly and get background alerts.
            </>
          ) : (
            <>
              Install for one-tap access and background alerts.
            </>
          )}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        {!ios && deferred && (
          <button
            onClick={install}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{
              background: primaryColor ?? "#4f46e5",
              color: contrastingTextColor(primaryColor ?? "#4f46e5"),
            }}
          >
            Install
          </button>
        )}
        <button
          onClick={dismiss}
          className="text-xs text-indigo-700/80 hover:underline dark:text-indigo-300/80"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
