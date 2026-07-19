"use client";

import type { ReactNode } from "react";
import { GuestGuard } from "@/lib/auth/guards";
import { UnauthedShell } from "@/components/layout/UnauthedShell";

export default function UnauthedLayout({ children }: { children: ReactNode }) {
  return (
    <GuestGuard>
      <UnauthedShell>{children}</UnauthedShell>
    </GuestGuard>
  );
}
