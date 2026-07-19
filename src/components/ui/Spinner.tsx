import clsx from "clsx";

export interface SpinnerProps {
  size?: number;
  className?: string;
}

/** Spinner contestuale (sezioni, bottoni). */
export function Spinner({ size = 20, className }: SpinnerProps) {
  return (
    <span
      className={clsx(
        "inline-block animate-spin rounded-full border-2 border-tint border-t-brand",
        className,
      )}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}

/** Overlay di caricamento globale (usato dal LoaderProvider, fase 1). */
export function LoaderOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/70">
      <Spinner size={32} />
    </div>
  );
}
