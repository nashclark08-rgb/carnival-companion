"use client";

import Link from "next/link";
import { useCarnival } from "@/lib/db";
import { DEFAULT_CARNIVAL_ID } from "@/lib/firebase";
import { contrastingTextColor, readableBorderColor } from "@/lib/color";

const FALLBACK_PRIMARY = "#4f46e5";
const FALLBACK_SECONDARY = "#7c3aed";

export function RolePicker() {
  const { carnival } = useCarnival(DEFAULT_CARNIVAL_ID);
  const primary = carnival?.branding?.primaryColor ?? FALLBACK_PRIMARY;
  const secondary = carnival?.branding?.secondaryColor ?? FALLBACK_SECONDARY;
  const primaryText = contrastingTextColor(primary);
  const secondaryText = contrastingTextColor(secondary);
  const studentBorder = readableBorderColor(primary, secondary);
  const parentBorder = readableBorderColor(secondary, primary);

  return (
    <div className="space-y-4">
      <Link
        href="/onboarding/student"
        className="block rounded-2xl border-4 p-6 shadow-lg transition active:scale-[0.98]"
        style={{
          background: primary,
          borderColor: studentBorder,
          color: primaryText,
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
        className="block rounded-2xl border-4 p-6 shadow-lg transition active:scale-[0.98]"
        style={{
          background: secondary,
          borderColor: parentBorder,
          color: secondaryText,
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
