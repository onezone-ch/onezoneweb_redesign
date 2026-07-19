"use client";

import type { ReactNode } from "react";
import { AuthGuard } from "@/lib/auth/guards";
import { AuthedShell } from "@/components/layout/AuthedShell";

export default function AuthedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AuthedShell>{children}</AuthedShell>
    </AuthGuard>
  );
}
