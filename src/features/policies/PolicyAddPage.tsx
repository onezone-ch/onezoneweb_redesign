"use client";

/**
 * Port di policyadd.component: selezione assicuratori con checkbox.
 * Submit: se l'utente ha già un mandato firmato (file con id) →
 * mandateInformInsurances + toast + home; altrimenti salva la selezione
 * in localStorage `selectedPolicies` e va ad /agreement.
 */

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import clsx from "clsx";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useLoader } from "@/lib/loader/LoaderProvider";
import { useNavigator } from "@/lib/navigation";
import { isset } from "@/lib/helper";
import { storage } from "@/lib/storage";
import * as brokerstar from "@/lib/api/brokerstar";
import { toaster } from "@/lib/toaster";

interface Insurance {
  id: number;
  name: string;
  selected: boolean;
}

export function PolicyAddPage() {
  const { userData } = useAuth();
  const { t } = useI18n();
  const loader = useLoader();
  const { navigateTo } = useNavigator();

  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    loader.show();
    brokerstar
      .insurance()
      .then((response) => {
        const data = (response as { data?: { id: number; name: string }[] })?.data || [];
        setInsurances(data.map((i) => ({ id: i.id, name: i.name, selected: false })));
      })
      .finally(() => loader.hide());
  }, [loader]);

  const toggle = (id: number) =>
    setInsurances((list) =>
      list.map((i) => (i.id === id ? { ...i, selected: !i.selected } : i)),
    );

  const submit = async () => {
    loader.show();
    try {
      const data = (await brokerstar.getDocumentCategoryItemInfo(
        String(userData.contact?.id),
      )) as { data?: { file?: { id?: number } }[] };
      const selectedPolicies = insurances.filter((i) => i.selected);
      const hasValidFileId = (data.data || []).some((entry) => isset(entry.file?.id));

      if (hasValidFileId) {
        // mandato già firmato → informa direttamente le assicurazioni
        void brokerstar.mandateInformInsurances(
          false,
          selectedPolicies.reduce<Record<string, boolean>>((acc, curr) => {
            acc[curr.id] = true;
            return acc;
          }, {}),
          null,
        );
        toaster.success(t("agreement", "successsend"));
        navigateTo("home");
      } else {
        storage.setItem("selectedPolicies", JSON.stringify(selectedPolicies));
        navigateTo("agreement");
      }
    } finally {
      loader.hide();
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col px-5 py-6">
      <h1 className="mb-4 text-[28px] font-bold tracking-[-0.7px] text-ink">
        {t("policy-add.title")}
      </h1>
      <p className="mb-6 text-[13.5px] leading-relaxed text-ink-2">
        {t("policy-add.text")}
      </p>

      <Card className="mb-6 p-0">
        <div className="max-h-80 overflow-y-auto">
          {insurances.map((insurance) => (
            <button
              key={insurance.id}
              type="button"
              onClick={() => toggle(insurance.id)}
              className={clsx(
                "flex w-full items-center justify-between border-t border-border-soft px-4 py-3 text-left transition-colors first:border-t-0",
                insurance.selected ? "bg-tint" : "hover:bg-tint-2",
              )}
            >
              <span
                className={clsx(
                  "truncate text-[14.5px] font-medium",
                  insurance.selected ? "text-brand" : "text-ink",
                )}
              >
                {insurance.name}
              </span>
              <span
                className={clsx(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  insurance.selected
                    ? "border-brand bg-brand text-white"
                    : "border-border bg-white",
                )}
              >
                {insurance.selected && <Check size={12} strokeWidth={2.2} />}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Button fullWidth onClick={() => void submit()}>
        {t("policy-add.button")}
      </Button>
    </div>
  );
}
