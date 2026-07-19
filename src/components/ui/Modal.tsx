"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  /** Larghezza massima del pannello (default 480px; il modal ricerca veicoli userà di più) */
  maxWidth?: string;
  className?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = "480px", className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={clsx(
          "flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-24 bg-white shadow-float sm:rounded-24",
          className,
        )}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between gap-4 border-b border-border-soft px-6 py-4">
            <div className="text-[18px] font-bold tracking-[-0.4px] text-ink">{title}</div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-11 text-muted transition-colors hover:bg-tint-2 hover:text-ink"
              aria-label="Close"
            >
              <X size={18} strokeWidth={1.6} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
