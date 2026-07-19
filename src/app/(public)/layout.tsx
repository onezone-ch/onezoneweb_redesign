"use client";

// Rotta pubblica del form preventivi: layout unauthed SENZA guard e senza footer
// (parita' con hideFooterNav dell'app Angular).
import type { ReactNode } from "react";
import { UnauthedShell } from "@/components/layout/UnauthedShell";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <UnauthedShell showFooter={false}>{children}</UnauthedShell>;
}
