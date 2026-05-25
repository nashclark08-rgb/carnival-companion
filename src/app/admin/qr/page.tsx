"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

const STORED_URL_KEY = "carnival-companion:qr-url";

export default function AdminQrPage() {
  const [url, setUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORED_URL_KEY);
    if (stored) {
      setUrl(stored);
      return;
    }
    const origin = window.location.origin;
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      setUrl("");
    } else {
      setUrl(origin);
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (!url) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height,
      );
      return;
    }
    QRCode.toCanvas(canvasRef.current, url, {
      width: 320,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
    }).catch(() => {});
  }, [url]);

  function rememberAndSet(next: string) {
    setUrl(next);
    if (next) {
      window.localStorage.setItem(STORED_URL_KEY, next);
    } else {
      window.localStorage.removeItem(STORED_URL_KEY);
    }
  }

  function useCurrentOrigin() {
    rememberAndSet(window.location.origin);
  }

  function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas || !url) return;
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "carnival-qr.png";
    a.click();
  }

  const isLocalhost =
    url.includes("localhost") || url.includes("127.0.0.1");
  const looksValid = /^https?:\/\/.+/i.test(url);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">QR code</h1>
        <p className="text-sm text-slate-500">
          Print this and display at the carnival entry. Attendees scan to open
          the app.
        </p>
      </header>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            URL the QR opens
          </span>
          <input
            type="url"
            className="input"
            placeholder="https://carnival-companion.vercel.app"
            value={url}
            onChange={(e) => rememberAndSet(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={useCurrentOrigin}
            className="rounded-lg border border-slate-300 px-2 py-1 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            Use this page&apos;s URL ({typeof window !== "undefined" ? window.location.origin : "—"})
          </button>
          {url && (
            <button
              type="button"
              onClick={() => rememberAndSet("")}
              className="rounded-lg border border-slate-300 px-2 py-1 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              Clear
            </button>
          )}
        </div>
        {isLocalhost && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
            This QR points at <code>localhost</code>. Attendees&apos; phones
            won&apos;t be able to open it — replace with your live URL (e.g.{" "}
            <code>https://carnival-companion.vercel.app</code>) before
            printing.
          </p>
        )}
        {!url && (
          <p className="rounded-lg border border-slate-300 bg-slate-50 p-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900">
            Type the deployed URL above to generate a QR.
          </p>
        )}
      </section>

      <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <canvas
          ref={canvasRef}
          className={`rounded-lg border border-slate-200 ${!url ? "opacity-30" : ""}`}
        />
        {url && (
          <p className="break-all text-sm text-slate-500">{url}</p>
        )}
        <button
          onClick={downloadPng}
          disabled={!url || !looksValid}
          className="rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
        >
          Download PNG
        </button>
      </div>
    </div>
  );
}
