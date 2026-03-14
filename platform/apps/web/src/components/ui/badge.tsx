import type { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success";
}

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: "text-lime-DEFAULT bg-lime-dim border-lime-border",
    secondary: "text-muted-foreground bg-surface border-surface-border",
    destructive: "text-red-400 bg-red-500/10 border-red-500/15",
    outline: "text-foreground border-surface-border",
    success: "text-lime-DEFAULT bg-lime-dim border-lime-border",
  };

  return (
    <div
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-sm font-semibold font-mono tracking-wide uppercase ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
