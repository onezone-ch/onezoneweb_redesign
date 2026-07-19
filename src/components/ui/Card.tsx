import type { HTMLAttributes } from "react";
import clsx from "clsx";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Ombra card per elementi flottanti (promo, drop-zone); default nessuna ombra */
  floating?: boolean;
}

export function Card({ floating, className, children, ...rest }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-16 border border-border-soft bg-white p-5",
        floating && "shadow-card",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
