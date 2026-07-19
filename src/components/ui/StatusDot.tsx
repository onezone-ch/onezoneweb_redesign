import type { ReactNode } from "react";
import clsx from "clsx";

export interface StatusDotProps {
  status: "success" | "muted" | "danger" | "warn";
  children?: ReactNode;
  className?: string;
}

const dotColors = {
  success: "bg-success",
  muted: "bg-muted",
  danger: "bg-danger",
  warn: "bg-warn",
};

/** Pallino di stato 8px + label (login attivo, scraper spento…). */
export function StatusDot({ status, children, className }: StatusDotProps) {
  return (
    <span className={clsx("inline-flex items-center gap-2 text-[13px] text-ink-2", className)}>
      <span className={clsx("h-2 w-2 rounded-full", dotColors[status])} />
      {children}
    </span>
  );
}
