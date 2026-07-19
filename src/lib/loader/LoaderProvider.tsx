"use client";

/**
 * Port di loader.service.ts — overlay di caricamento globale a contatore:
 * show() incrementa, hide() decrementa, visibile finché counter > 0.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { LoaderOverlay } from "@/components/ui";

interface LoaderContextValue {
  show: () => void;
  hide: () => void;
  reset: () => void;
  loading: boolean;
}

const LoaderContext = createContext<LoaderContextValue | null>(null);

export function LoaderProvider({ children }: { children: ReactNode }) {
  const counter = useRef(0);
  const [loading, setLoading] = useState(false);

  const check = useCallback(() => {
    queueMicrotask(() => setLoading(counter.current > 0));
  }, []);

  const show = useCallback(() => {
    counter.current += 1;
    check();
  }, [check]);

  const hide = useCallback(() => {
    counter.current -= 1;
    check();
  }, [check]);

  const reset = useCallback(() => {
    counter.current = 0;
    check();
  }, [check]);

  const value = useMemo(
    () => ({ show, hide, reset, loading }),
    [show, hide, reset, loading],
  );

  return (
    <LoaderContext.Provider value={value}>
      {children}
      <LoaderOverlay visible={loading} />
    </LoaderContext.Provider>
  );
}

export function useLoader(): LoaderContextValue {
  const ctx = useContext(LoaderContext);
  if (!ctx) throw new Error("useLoader must be used within LoaderProvider");
  return ctx;
}
