"use client";

import { useRef, type HTMLAttributes } from "react";
import clsx from "clsx";

/**
 * Contenitore a scorrimento orizzontale senza scrollbar visibile.
 * Su touch/trackpad scorre nativamente; su desktop col mouse si trascina
 * (drag-to-scroll), sopprimendo il click sui figli quando c'è stato un drag.
 */
export function HScroll({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ startX: 0, startScroll: 0, active: false, moved: false });

  return (
    <div
      ref={ref}
      className={clsx(
        "cursor-grab select-none overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse" || e.button !== 0 || !ref.current) return;
        drag.current = {
          startX: e.clientX,
          startScroll: ref.current.scrollLeft,
          active: true,
          moved: false,
        };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d.active || !ref.current) return;
        const dx = e.clientX - d.startX;
        // soglia anti-jitter: sotto i 5px resta un click normale
        if (!d.moved && Math.abs(dx) < 5) return;
        d.moved = true;
        ref.current.setPointerCapture(e.pointerId);
        ref.current.scrollLeft = d.startScroll - dx;
      }}
      onPointerUp={() => {
        drag.current.active = false;
      }}
      onPointerCancel={() => {
        drag.current.active = false;
        drag.current.moved = false;
      }}
      onClickCapture={(e) => {
        if (drag.current.moved) {
          e.preventDefault();
          e.stopPropagation();
          drag.current.moved = false;
        }
      }}
      onDragStart={(e) => e.preventDefault()}
      {...rest}
    >
      {children}
    </div>
  );
}
