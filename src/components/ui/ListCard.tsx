import type { HTMLAttributes, ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import clsx from "clsx";

/** Card contenitore per righe navigabili (home, menu, coperture, clienti). */
export function ListCard({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "overflow-hidden rounded-16 border border-border-soft bg-white",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface ListRowProps {
  /** Icona lucide (18px, stroke 1.6) resa nel chip tint 36×36 */
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Evidenzia il sottotitolo in blu (es. "2 da rivedere") */
  subtitleAccent?: boolean;
  /** Mostra il chevron di navigazione (default true se onClick presente) */
  chevron?: boolean;
  onClick?: () => void;
  className?: string;
  /** Contenuto extra a destra (badge, StatusDot) al posto del chevron */
  trailing?: ReactNode;
}

export function ListRow({
  icon,
  title,
  subtitle,
  subtitleAccent,
  chevron,
  onClick,
  className,
  trailing,
}: ListRowProps) {
  const showChevron = chevron ?? !!onClick;
  const content = (
    <>
      {icon && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-11 bg-tint text-brand">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1 text-left">
        <div className="truncate text-[14.5px] font-semibold text-ink">{title}</div>
        {subtitle && (
          <div
            className={clsx(
              "mt-px truncate text-[12px]",
              subtitleAccent ? "font-semibold text-brand" : "text-muted",
            )}
          >
            {subtitle}
          </div>
        )}
      </div>
      {trailing}
      {showChevron && (
        <ChevronRight size={16} strokeWidth={1.6} className="shrink-0 text-muted" />
      )}
    </>
  );

  const rowClasses = clsx(
    "flex w-full items-center gap-[14px] border-t border-border-soft px-4 py-[14px] first:border-t-0",
    onClick && "cursor-pointer transition-colors hover:bg-tint-2",
    className,
  );

  return onClick ? (
    <button type="button" onClick={onClick} className={rowClasses}>
      {content}
    </button>
  ) : (
    <div className={rowClasses}>{content}</div>
  );
}
