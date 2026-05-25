"use client";

import Link from "next/link";
import { useCarnival } from "@/lib/db";
import { DEFAULT_CARNIVAL_ID } from "@/lib/firebase";

export function RolePicker() {
  const { carnival } = useCarnival(DEFAULT_CARNIVAL_ID);
  const primary = carnival?.branding?.primaryColor;
  const secondary = carnival?.branding?.secondaryColor;

  return (
    <div className="space-y-4">
      <Link
        href="/onboarding/student"
        className="block rounded-2xl p-6 text-white shadow-lg transition active:scale-[0.98]"
        style={{
          background: primary
            ? `linear-gradient(135deg, ${primary}, ${secondary ?? primary})`
            : "#4f46e5",
        }}
      >
        <p className="text-sm uppercase tracking-wide opacity-80">I&apos;m a</p>
        <h2 className="text-2xl font-bold">Student</h2>
        <p className="mt-1 text-sm opacity-90">
          Competing in events today
        </p>
      </Link>
      <Link
        href="/onboarding/parent"
        className="block rounded-2xl p-6 text-white shadow-lg transition active:scale-[0.98]"
        style={{
          background: secondary
            ? `linear-gradient(135deg, ${secondary}, ${primary ?? secondary})`
            : "#059669",
        }}
      >
        <p className="text-sm uppercase tracking-wide opacity-80">I&apos;m a</p>
        <h2 className="text-2xl font-bold">Parent / Spectator</h2>
        <p className="mt-1 text-sm opacity-90">
          Following my child or watching the carnival
        </p>
      </Link>
    </div>
  );
}
