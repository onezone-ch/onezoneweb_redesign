"use client";

import type { ReactNode } from "react";
import { AuthGuard } from "@/lib/auth/guards";
import { PdfShell } from "@/components/layout/PdfShell";

export default function PdfLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <PdfShell>{children}</PdfShell>
    </AuthGuard>
  );
}
