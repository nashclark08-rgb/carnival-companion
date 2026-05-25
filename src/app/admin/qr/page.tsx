"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export default function AdminQrPage() {
  const [origin, setOrigin] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!origin || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, origin, {
      width: 320,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
    });
  }, [origin]);

  function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "carnival-qr.png";
    a.click();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">QR code</h1>
        <p className="text-sm text-slate-500">
          Print this and display at the carnival entry. Attendees scan to open
          the app.
        </p>
      </header>

      <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <canvas ref={canvasRef} className="rounded-lg border border-slate-200" />
        <p className="text-sm text-slate-500 break-all">{origin}</p>
        <button
          onClick={downloadPng}
          className="rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white shadow hover:bg-indigo-700"
        >
          Download PNG
        </button>
      </div>
    </div>
  );
}
