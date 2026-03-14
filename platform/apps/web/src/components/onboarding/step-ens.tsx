"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ENS_PARENT_NAME } from "@/lib/constants";

interface StepEnsProps {
  onComplete: (ensName: string) => void;
}

export function StepEns({ onComplete }: StepEnsProps) {
  const [label, setLabel] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  const checkAvailability = async () => {
    if (!label) return;
    setIsChecking(true);
    setError("");
    try {
      const res = await fetch(`/api/ens/check?label=${label}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setAvailable(null);
      } else {
        setAvailable(data.available);
        if (!data.available) setError("Name already taken");
      }
    } catch {
      setError("Failed to check availability");
    } finally {
      setIsChecking(false);
    }
  };

  const registerName = async () => {
    setIsRegistering(true);
    setError("");
    try {
      const res = await fetch("/api/ens/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        onComplete(data.ensName);
      }
    } catch {
      setError("Failed to register name");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Your ENS Name</CardTitle>
        <CardDescription>
          Pick a handle for your agent identity on {ENS_PARENT_NAME}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="myagent"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
              setAvailable(null);
              setError("");
            }}
          />
          <span className="flex items-center text-sm text-muted-foreground whitespace-nowrap">
            .{ENS_PARENT_NAME}
          </span>
          <Button variant="outline" onClick={checkAvailability} disabled={!label || isChecking}>
            {isChecking ? "Checking..." : "Check"}
          </Button>
        </div>

        {available === true && (
          <p className="text-sm text-green-500">
            {label}.{ENS_PARENT_NAME} is available!
          </p>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          onClick={registerName}
          disabled={!available || isRegistering}
          className="w-full"
        >
          {isRegistering ? "Registering..." : `Register ${label}.${ENS_PARENT_NAME}`}
        </Button>
      </CardContent>
    </Card>
  );
}
