"use client";

/**
 * Chrome fullscreen per la visualizzazione documenti (port di layout-pdf):
 * header minimale con solo il bottone indietro.
 */

import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigator } from "@/lib/navigation";

export function PdfShell({ children }: { children: ReactNode }) {
  const { back } = useNavigator();

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <header className="flex h-14 shrink-0 items-center border-b border-border bg-white px-4">
        <button
          type="button"
          onClick={back}
          className="flex h-10 w-10 items-center justify-center rounded-11 text-brand transition-colors hover:bg-tint-2"
          aria-label="Go back"
        >
          <ChevronLeft size={22} strokeWidth={1.6} />
        </button>
      </header>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
