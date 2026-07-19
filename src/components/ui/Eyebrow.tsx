import type { HTMLAttributes } from "react";
import clsx from "clsx";

export interface EyebrowProps extends HTMLAttributes<HTMLDivElement> {
  /** brand per titoli di sezione, muted per label generiche */
  tone?: "muted" | "brand";
}

export function Eyebrow({ tone = "muted", className, children, ...rest }: EyebrowProps) {
  return (
    <div
      className={clsx(
        "text-[11px] font-semibold uppercase tracking-[0.6px]",
        tone === "brand" ? "text-brand" : "text-muted",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
