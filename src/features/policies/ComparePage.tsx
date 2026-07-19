"use client";

/**
 * Port di policycalculate.component (/compare): griglia di categorie che
 * aprono i comparatori esterni onezone.ch con `%CID%` sostituito
 * dall'uniqueId del contatto.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Car,
  FileSearch,
  FileText,
  Gavel,
  House,
  KeyRound,
  PawPrint,
  Plane,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useLoader } from "@/lib/loader/LoaderProvider";
import { useNavigator } from "@/lib/navigation";
import * as brokerstar from "@/lib/api/brokerstar";
import statics from "@/data/statics.json";

const BUTTONS: { icon: ReactNode; label: string; linkKey: keyof typeof statics }[] = [
  { icon: <FileSearch size={22} strokeWidth={1.6} />, label: "insurance", linkKey: "LinkOneZoneCompareInsurance" },
  { icon: <Car size={22} strokeWidth={1.6} />, label: "car", linkKey: "LinkOneZoneCompareCar" },
  { icon: <House size={22} strokeWidth={1.6} />, label: "household", linkKey: "LinkOneZoneCompareHousehold" },
  { icon: <KeyRound size={22} strokeWidth={1.6} />, label: "rent", linkKey: "LinkOneZoneCompareRent" },
  { icon: <Gavel size={22} strokeWidth={1.6} />, label: "law", linkKey: "LinkOneZoneCompareLaw" },
  { icon: <Plane size={22} strokeWidth={1.6} />, label: "travel", linkKey: "LinkOneZoneCompareTravel" },
  { icon: <FileText size={22} strokeWidth={1.6} />, label: "pension", linkKey: "LinkOneZoneComparePension" },
  { icon: <PawPrint size={22} strokeWidth={1.6} />, label: "animal", linkKey: "LinkOneZoneCompareAnimal" },
];

export function ComparePage() {
  const { userData } = useAuth();
  const { lang, t } = useI18n();
  const loader = useLoader();
  const { navigateTo } = useNavigator();

  const [cid, setCid] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    loader.show();
    brokerstar
      .contact(userData.contact?.id ?? 0)
      .then((response) => {
        setCid(String((response as { uniqueId?: string })?.uniqueId ?? ""));
      })
      .finally(() => loader.hide());
  }, [loader, userData]);

  const openCompare = (linkKey: keyof typeof statics) => {
    const links = statics[linkKey] as Record<string, string>;
    navigateTo(links[lang].replace("%CID%", cid));
  };

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col px-5 py-6">
      <h1 className="mb-6 text-[28px] font-bold tracking-[-0.7px] text-ink">
        {t("compare.title")}
      </h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {BUTTONS.map((button) => (
          <button
            key={button.label}
            type="button"
            onClick={() => openCompare(button.linkKey)}
            className="flex flex-col items-center gap-3 rounded-16 border border-border-soft bg-white p-5 transition-all hover:border-border hover:shadow-card"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-11 bg-tint text-brand">
              {button.icon}
            </span>
            <span className="text-center text-[13.5px] font-semibold leading-tight text-ink">
              {t(`compare.${button.label}`)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
