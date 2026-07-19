import clsx from "clsx";

export interface StepBarProps {
  /** Numero totale di step */
  steps: number;
  /** Step corrente, 0-based */
  current: number;
  className?: string;
}

/** Progress a segmenti per i wizard (automation-setup, automation-form). */
export function StepBar({ steps, current, className }: StepBarProps) {
  return (
    <div className={clsx("flex gap-[5px]", className)} role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={steps}>
      {Array.from({ length: steps }, (_, i) => (
        <div
          key={i}
          className={clsx(
            "h-1 w-7 rounded-[2px]",
            i < current && "bg-brand",
            i === current && "bg-brand/40",
            i > current && "bg-[#e4e7ef]",
          )}
        />
      ))}
    </div>
  );
}
