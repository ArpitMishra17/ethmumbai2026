"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function CliTokenGenerator() {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/cli/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "dashboard" }),
      });
      const data = await res.json();
      if (res.ok) setToken(data.token);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const copyToken = async () => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">CLI Token</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {token ? (
          <>
            <code className="text-xs break-all block bg-muted p-3 rounded">{token}</code>
            <div className="flex items-center gap-2">
              <Button onClick={copyToken} size="sm" variant="outline">
                {copied ? "Copied!" : "Copy token"}
              </Button>
              <p className="text-xs text-muted-foreground">
                agentcover setup --token &lt;token&gt;
              </p>
            </div>
            <p className="text-xs text-destructive">
              This token is shown only once. Store it securely — it cannot be retrieved later.
            </p>
          </>
        ) : (
          <Button onClick={generate} disabled={isLoading} size="sm">
            {isLoading ? "Generating..." : "Generate CLI Token"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
