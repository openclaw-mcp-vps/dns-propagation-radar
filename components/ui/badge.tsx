import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  variant = "default"
}: {
  children: ReactNode;
  className?: string;
  variant?: "default" | "success" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        variant === "default" && "border-slate-700 bg-slate-900 text-slate-200",
        variant === "success" && "border-emerald-600/60 bg-emerald-950 text-emerald-300",
        variant === "danger" && "border-rose-600/60 bg-rose-950 text-rose-300",
        className
      )}
    >
      {children}
    </span>
  );
}
