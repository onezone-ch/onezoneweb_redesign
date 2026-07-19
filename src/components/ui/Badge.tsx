import type { HTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "blue" | "success" | "danger" | "warn" | "solid";

const variantClasses: Record<Variant, string> = {
  blue: "bg-tint text-brand",
  success: "bg-success-bg text-success",
  danger: "bg-danger-bg text-danger",
  warn: "bg-warn-bg text-warn",
  /* Badge blu pieno — es. conteggio sul tab attivo */
  solid: "bg-brand text-white",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({ variant = "blue", className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-[6px] px-2 py-[3px] text-[10px] font-bold uppercase tracking-[0.5px]",
        variantClasses[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
