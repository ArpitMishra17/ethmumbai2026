import { forwardRef, type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-md font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-DEFAULT disabled:pointer-events-none disabled:opacity-40 font-mono text-sm";

    const variants: Record<string, string> = {
      default:
        "bg-lime-DEFAULT text-black border border-lime-DEFAULT hover:bg-[#c8fc5a] hover:border-[#c8fc5a]",
      outline:
        "border border-lime-border bg-transparent text-lime-DEFAULT hover:bg-lime-subtle",
      ghost:
        "text-lime-DEFAULT hover:bg-lime-subtle border border-transparent",
      destructive:
        "bg-destructive text-destructive-foreground border border-destructive hover:bg-destructive/90",
    };

    const sizes: Record<string, string> = {
      default: "h-10 px-5 py-2",
      sm: "h-9 px-4 py-1.5",
      lg: "h-12 px-8 py-3 text-base",
    };

    return (
      <button
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
