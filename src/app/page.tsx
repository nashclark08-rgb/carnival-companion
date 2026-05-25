"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RolePicker } from "@/components/RolePicker";
import { BrandedHeader } from "@/components/BrandedHeader";
import { loadProfile } from "@/lib/attendee";
import { useCarnival } from "@/lib/db";
import { DEFAULT_CARNIVAL_ID } from "@/lib/firebase";

export default function Home() {
  const router = useRouter();
  const { carnival } = useCarnival(DEFAULT_CARNIVAL_ID);

  useEffect(() => {
    const profile = loadProfile();
    if (profile) {
      router.replace("/schedule");
    }
  }, [router]);

  return (
    <div className="flex flex-1 flex-col">
      <BrandedHeader carnival={carnival} subtitle={carnival?.schoolName} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center p-6">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold">
            {carnival?.name ?? "Carnival Companion"}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Always know where you need to be, and when.
          </p>
        </header>
        <RolePicker />
        <p className="mt-8 text-center text-xs text-slate-500">
          Staff?{" "}
          <a href="/admin" className="underline">
            Admin sign in
          </a>
        </p>
      </main>
    </div>
  );
}
