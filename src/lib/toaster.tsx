"use client";

/**
 * Port di toaster.service.ts su sonner, stilizzato sul design system.
 * API preservata: primary / accent / alert / warn / success.
 */

import { Toaster as SonnerToaster, toast } from "sonner";

export const toaster = {
  primary(text: string): void {
    toast.info(text);
  },
  accent(text: string): void {
    toast.info(text);
  },
  alert(text: string): void {
    toast.warning(text);
  },
  warn(text: string): void {
    toast.error(text);
  },
  success(text: string): void {
    toast.success(text);
  },
};

/** Da montare una volta nel root layout. */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        style: {
          fontFamily: "var(--font-sans)",
          borderRadius: "12px",
          fontSize: "13.5px",
          fontWeight: 500,
        },
      }}
    />
  );
}
