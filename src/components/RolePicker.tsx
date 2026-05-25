"use client";

import Link from "next/link";

export function RolePicker() {
  return (
    <div className="space-y-4">
      <Link
        href="/onboarding/student"
        className="block rounded-2xl bg-indigo-600 p-6 text-white shadow-lg transition hover:bg-indigo-700 active:scale-[0.98]"
      >
        <p className="text-sm uppercase tracking-wide opacity-80">I&apos;m a</p>
        <h2 className="text-2xl font-bold">Student</h2>
        <p className="mt-1 text-sm opacity-90">
          Competing in events today
        </p>
      </Link>
      <Link
        href="/onboarding/parent"
        className="block rounded-2xl bg-emerald-600 p-6 text-white shadow-lg transition hover:bg-emerald-700 active:scale-[0.98]"
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
