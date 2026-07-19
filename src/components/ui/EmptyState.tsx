import type { ReactNode } from "react";
import clsx from "clsx";

export interface EmptyStateProps {
  /** Icona lucide (24px, stroke 1.6) */
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** CTA opzionale (Button) */
  action?: ReactNode;
  className?: string;
}

/** Stato vuoto per liste (polizze, offerte, clienti). */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx("flex flex-col items-center gap-3 px-6 py-12 text-center", className)}>
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-14 bg-tint text-brand">
          {icon}
        </div>
      )}
      <div className="text-[15px] font-semibold text-ink">{title}</div>
      {description && <p className="max-w-[320px] text-[13px] text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
