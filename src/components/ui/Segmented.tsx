"use client";

import type { ReactNode } from "react";
import clsx from "clsx";
import { Badge } from "./Badge";

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Conteggio opzionale (variante tab offerte) */
  count?: number;
}

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** true → i segmenti si distribuiscono a piena larghezza (variante tab) */
  fullWidth?: boolean;
  className?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  fullWidth,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="tablist"
      className={clsx(
        "inline-flex rounded-12 bg-segmented p-1",
        fullWidth && "flex w-full",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={clsx(
              "flex items-center justify-center gap-[6px] rounded-[9px] px-4 py-2 text-[13px] font-semibold transition-colors",
              fullWidth && "flex-1",
              active ? "bg-white text-ink shadow-seg" : "text-muted hover:text-ink-2",
            )}
          >
            {opt.label}
            {opt.count !== undefined &&
              (active ? (
                <Badge variant="solid">{opt.count}</Badge>
              ) : (
                <span className="text-muted">{opt.count}</span>
              ))}
          </button>
        );
      })}
    </div>
  );
}
