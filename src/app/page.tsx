"use client";

/** Parità con la rotta '' Angular: redirect a /login (o /home se loggati). */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { LoaderOverlay } from "@/components/ui";

export default function RootPage() {
  const { ready, isLogged } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    router.replace(isLogged() ? "/home" : "/login");
  }, [ready, isLogged, router]);

  return <LoaderOverlay visible />;
}
