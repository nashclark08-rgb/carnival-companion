import { OnboardingForm } from "@/components/OnboardingForm";

export default function ParentOnboardingPage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 p-6">
      <p className="mb-2 text-xs uppercase tracking-wide text-emerald-600">
        Parent / Spectator
      </p>
      <OnboardingForm role="parent" />
    </main>
  );
}
