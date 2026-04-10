"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const completed = useOnboardingStore((s) => s.completed);

  useEffect(() => {
    if (completed) {
      router.replace("/dashboard");
    } else {
      router.replace("/onboarding");
    }
  }, [completed, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading CORTEX...</p>
      </div>
    </div>
  );
}
