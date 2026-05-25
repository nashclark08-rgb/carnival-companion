import { Suspense } from "react";
import { OnboardingFormWrapper } from "@/components/OnboardingFormWrapper";

export default function ParentOnboardingPage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 p-6">
      <p className="mb-2 text-xs uppercase tracking-wide text-emerald-600">
        Parent / Spectator
      </p>
      <Suspense fallback={<p className="text-slate-500">Loading…</p>}>
        <OnboardingFormWrapper role="parent" />
      </Suspense>
    </main>
  );
}
