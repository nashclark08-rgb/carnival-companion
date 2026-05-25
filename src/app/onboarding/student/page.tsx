import { OnboardingForm } from "@/components/OnboardingForm";

export default function StudentOnboardingPage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 p-6">
      <p className="mb-2 text-xs uppercase tracking-wide text-indigo-600">
        Student
      </p>
      <OnboardingForm role="student" />
    </main>
  );
}
