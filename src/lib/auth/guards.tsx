"use client";

/**
 * Port dei functional guard di group.guard.ts:
 * - AuthGuard: se non loggato → /login (rotte private);
 * - GuestGuard: se loggato → /home (rotte login/register/...).
 * Rendono un loader finché la sessione non è caricata (nessun flash di contenuto).
 */

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { LoaderOverlay } from "@/components/ui";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { ready, isLogged } = useAuth();
  const router = useRouter();
  const logged = ready && isLogged();

  useEffect(() => {
    if (ready && !logged) {
      router.replace("/login");
    }
  }, [ready, logged, router]);

  if (!logged) {
    return <LoaderOverlay visible />;
  }
  return <>{children}</>;
}

export function GuestGuard({ children }: { children: ReactNode }) {
  const { ready, isLogged } = useAuth();
  const router = useRouter();
  const logged = ready && isLogged();

  useEffect(() => {
    if (logged) {
      router.replace("/home");
    }
  }, [logged, router]);

  if (!ready || logged) {
    return <LoaderOverlay visible />;
  }
  return <>{children}</>;
}
