import { Suspense } from "react";
import { EventPickerScreen } from "@/components/EventPickerScreen";

export default function EventSelectionPage() {
  return (
    <main className="mx-auto w-full max-w-lg flex-1 p-4">
      <Suspense fallback={<p className="text-slate-500">Loading…</p>}>
        <EventPickerScreen />
      </Suspense>
    </main>
  );
}
