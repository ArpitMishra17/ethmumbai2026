"use client";

import { useState, useCallback, useEffect } from "react";
import type { OnboardingStatus } from "@/types";

export function useOnboarding() {
  const [status, setStatus] = useState<OnboardingStatus>("wallet_pending");
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/onboarding");
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const advanceTo = useCallback(async (newStatus: OnboardingStatus) => {
    try {
      const res = await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
      }
    } catch {
      // ignore
    }
  }, []);

  return { status, isLoading, fetchStatus, advanceTo };
}
