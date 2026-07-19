"use client";

/**
 * Port di policyselect.component: scegli una polizza → /report/:policyid.
 */

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useLoader } from "@/lib/loader/LoaderProvider";
import { useNavigator } from "@/lib/navigation";
import * as brokerstar from "@/lib/api/brokerstar";
import { PolicyCard, type PolicyItem } from "./PolicyCard";
import { loadAvatarDataUrl } from "./insuranceAvatar";

export function PolicySelectPage() {
  const { lang, t } = useI18n();
  const loader = useLoader();
  const { navigateTo } = useNavigator();

  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    loader.show();
    brokerstar
      .policyList()
      .then((response) => {
        const data = (response as { data?: Record<string, unknown>[] })?.data || [];
        const mapped = data.map((policy) => {
          const p = policy as {
            id: number;
            insurance: { id: number };
            branch: { name: Record<string, string> };
            insuredCars?: { plate: string }[];
          };
          return {
            id: p.id,
            insurance: p.insurance.id,
            title: p.branch.name,
            licencePlate:
              p.insuredCars && p.insuredCars.length > 0 ? p.insuredCars[0].plate : "",
            selected: false,
          };
        });
        setPolicies(mapped);
        mapped.forEach((policy) => {
          void loadAvatarDataUrl(policy.insurance).then((img) => {
            if (!img) return;
            setPolicies((prev) =>
              prev.map((p) => (p.insurance === policy.insurance ? { ...p, img } : p)),
            );
          });
        });
      })
      .finally(() => loader.hide());
  }, [loader]);

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col px-5 py-6">
      <h1 className="mb-6 text-[28px] font-bold tracking-[-0.7px] text-ink">
        {t("injure.title")}
      </h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {policies.map((policy) => (
          <PolicyCard
            key={policy.id}
            policy={policy}
            lang={lang}
            onClick={() => navigateTo(`report/${policy.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
