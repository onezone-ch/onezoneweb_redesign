"use client";

/** Card polizza per le griglie (logo assicurazione + targa/ramo). */

import { ShieldCheck } from "lucide-react";

export interface PolicyItem {
  id: number;
  insurance: number;
  title: Record<string, string> | string;
  licencePlate: string | null;
  img?: string;
  selected?: boolean;
}

export function policyLabel(policy: PolicyItem, lang: string): string {
  if (policy.licencePlate) return policy.licencePlate;
  if (typeof policy.title === "string") return policy.title;
  return policy.title?.[lang] ?? "";
}

export function PolicyCard({
  policy,
  lang,
  onClick,
}: {
  policy: PolicyItem;
  lang: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center rounded-16 border border-border-soft bg-white p-4 transition-all hover:border-border hover:shadow-card"
    >
      <div className="mb-3 flex h-16 items-center justify-center">
        {policy.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={policy.img}
            alt={policyLabel(policy, lang)}
            className="max-h-16 max-w-full object-contain"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-11 bg-tint text-brand">
            <ShieldCheck size={20} strokeWidth={1.6} />
          </div>
        )}
      </div>
      <p className="text-center text-[12.5px] font-semibold leading-tight text-ink">
        {policyLabel(policy, lang)}
      </p>
    </button>
  );
}
