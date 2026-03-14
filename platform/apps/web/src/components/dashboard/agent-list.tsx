"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InsuredAgentData } from "@/types";

export function AgentList() {
  const [agents, setAgents] = useState<InsuredAgentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d) => setAgents(d.agents || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <p className="text-muted-foreground">Loading agents...</p>;
  if (agents.length === 0) return <p className="text-muted-foreground">No agents registered yet.</p>;

  return (
    <div className="space-y-4">
      {agents.map((agent) => (
        <Card key={agent.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">{agent.name}</CardTitle>
            <div className="flex gap-2">
              <Badge variant={agent.isActive ? "default" : "destructive"}>
                {agent.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge
                variant={
                  agent.verificationStatus === "verified"
                    ? "success"
                    : agent.verificationStatus === "failed"
                      ? "destructive"
                      : "secondary"
                }
              >
                {agent.verificationStatus}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Agent ID:</span> {agent.agentId}
              </div>
              {agent.ensName && (
                <div>
                  <span className="text-muted-foreground">ENS:</span> {agent.ensName}
                </div>
              )}
              {agent.description && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Description:</span> {agent.description}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
