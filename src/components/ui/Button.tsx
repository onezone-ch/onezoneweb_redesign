import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Icona lucide opzionale, resa a sinistra del testo */
  icon?: ReactNode;
  /** Full-width (default su mobile per le azioni primarie di pagina) */
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  secondary: "bg-white text-ink border border-border hover:bg-tint-2",
  ghost: "bg-tint text-brand hover:bg-[#e2e8f4]",
  danger: "bg-danger-bg text-danger hover:bg-[#f3dde3]",
};

const sizeClasses: Record<Size, string> = {
  md: "px-[18px] py-[13px] text-[15px]",
  sm: "px-[14px] py-[9px] text-[13px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", icon, fullWidth, className, children, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-12 font-semibold tracking-[-0.1px]",
          "cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className,
        )}
        {...rest}
      >
        {icon}
        {children}
      </button>
    );
  },
);
