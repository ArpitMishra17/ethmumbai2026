import { forwardRef, type InputHTMLAttributes } from "react";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      className={`flex h-10 w-full rounded-md border border-surface-border bg-surface px-4 py-2 text-sm text-foreground font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime-DEFAULT focus-visible:border-lime-border disabled:cursor-not-allowed disabled:opacity-40 transition-colors ${className}`}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
