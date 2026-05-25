"use client";

import { useSearchParams } from "next/navigation";
import { OnboardingForm } from "./OnboardingForm";
import { Role } from "@/lib/types";

export function OnboardingFormWrapper({ role }: { role: Role }) {
  const params = useSearchParams();
  const mode = params.get("mode") === "addChild" ? "addChild" : "new";
  return <OnboardingForm role={role} mode={mode} />;
}
