"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/lib/query/QueryProvider";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { LoaderProvider } from "@/lib/loader/LoaderProvider";
import { Toaster } from "@/lib/toaster";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <I18nProvider>
        <AuthProvider>
          <LoaderProvider>
            {children}
            <Toaster />
          </LoaderProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryProvider>
  );
}
