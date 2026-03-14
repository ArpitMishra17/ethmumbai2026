"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface StepCollectorProps {
  onComplete: () => void;
}

export function StepCollector({ onComplete }: StepCollectorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  const generateToken = async () => {
    setIsGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/cli/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "onboarding" }),
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
      } else {
        setError(data.error || "Failed to generate token");
      }
    } catch {
      setError("Failed to generate token");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleComplete = async () => {
    try {
      await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      onComplete();
    } catch {
      setError("Failed to complete onboarding");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>CLI Setup</CardTitle>
        <CardDescription>
          Generate a token to connect the AgentCover CLI to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!token ? (
          <Button onClick={generateToken} disabled={isGenerating} className="w-full">
            {isGenerating ? "Generating..." : "Generate CLI Token"}
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium">Your CLI Token:</p>
            <code className="text-xs break-all block bg-muted p-3 rounded">
              {token}
            </code>
            <p className="text-sm text-muted-foreground">
              Run: <code className="bg-muted px-1 rounded">agentcover setup --token {token}</code>
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button onClick={handleComplete} variant="outline" className="w-full">
          {token ? "Complete Setup" : "Skip for Now"}
        </Button>
      </CardContent>
    </Card>
  );
}
