"use client";

/** Segnaposto temporaneo di fase 2 — sostituito pagina per pagina in fase 3. */

import { Construction } from "lucide-react";
import { Card, Eyebrow } from "@/components/ui";

export function Placeholder({ route, param }: { route: string; param?: string }) {
  return (
    <div className="mx-auto w-full max-w-[560px] px-5 py-10">
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-11 bg-tint text-brand">
            <Construction size={18} strokeWidth={1.6} />
          </div>
          <div>
            <Eyebrow>In costruzione</Eyebrow>
            <div className="text-[18px] font-bold tracking-[-0.4px]">/{route}</div>
            {param && <div className="text-[13px] text-muted">param: {param}</div>}
          </div>
        </div>
      </Card>
    </div>
  );
}
