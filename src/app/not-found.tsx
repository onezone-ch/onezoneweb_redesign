"use client";

/** Parità con il wildcard '**' Angular: qualsiasi rotta sconosciuta → /login. */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderOverlay } from "@/components/ui";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return <LoaderOverlay visible />;
}
