"use client";

/**
 * Port di policy.component: dettaglio polizza — card logo, numero, scadenza,
 * ultima fattura premi (se presente), bottoni copia polizza (se documento),
 * segnala sinistro, contatta consulente.
 */

import { useEffect, useRef, useState } from "react";
import { Copy, Phone, ShieldCheck, TriangleAlert } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useLoader } from "@/lib/loader/LoaderProvider";
import { useNavigator } from "@/lib/navigation";
import { getDatetimeFromTimestamp } from "@/lib/helper";
import * as brokerstar from "@/lib/api/brokerstar";
import { loadAvatarDataUrl } from "./insuranceAvatar";

function getDDMMYYYY(dtString: string): string {
  return getDatetimeFromTimestamp(new Date(dtString).getTime(), false, true, false);
}

interface PolicyState {
  id: number;
  insurance: number;
  img: string;
  title: Record<string, string> | string;
  licencePlate: string | null;
  nr: string;
  endDate: number;
  invoiceamount: string;
  invoicedate: string;
}

export function PolicyPage({ policyid }: { policyid: string }) {
  const { lang, t } = useI18n();
  const loader = useLoader();
  const { navigateTo } = useNavigator();

  const [policy, setPolicy] = useState<PolicyState>({
    id: 0,
    insurance: 0,
    img: "",
    title: "",
    licencePlate: null,
    nr: "",
    endDate: 0,
    invoiceamount: "",
    invoicedate: "",
  });
  const [policyDocument, setPolicyDocument] = useState<{ id: number | null }>({
    id: null,
  });
  const [hasBilling, setHasBilling] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const load = async () => {
      loader.show();
      try {
        const response = (await brokerstar.policy(policyid)) as {
          insurance: { id: number };
          branch: { name: Record<string, string> };
          insuredCars?: { plate: string }[];
          endDate: string;
          nr: unknown;
          policyDocument?: { id: number | null };
        };
        const insuranceId = response.insurance.id;
        setPolicy((p) => ({
          ...p,
          id: Number(policyid),
          insurance: insuranceId,
          title: response.branch.name,
          licencePlate:
            response.insuredCars && response.insuredCars.length > 0
              ? response.insuredCars[0].plate
              : null,
          endDate: new Date(String(response.endDate)).getTime(),
          nr: String(response.nr),
        }));
        setPolicyDocument(response.policyDocument ?? { id: null });

        void loadAvatarDataUrl(insuranceId).then((img) => {
          if (img) setPolicy((p) => ({ ...p, img }));
        });

        loader.show();
        try {
          const invoice = (await brokerstar.premiumInvoice(policyid)) as {
            amountBrutto?: number;
            startDate?: string;
            endDate?: string;
          };
          if (invoice && invoice.amountBrutto !== undefined) {
            setHasBilling(true);
            setPolicy((p) => ({
              ...p,
              invoiceamount: `${invoice.amountBrutto} CHF`,
              invoicedate: `${getDDMMYYYY(invoice.startDate!)} bis ${getDDMMYYYY(invoice.endDate!)}`,
            }));
          }
        } finally {
          loader.hide();
        }
      } finally {
        loader.hide();
      }
    };
    void load();
  }, [policyid, loader]);

  const title =
    policy.licencePlate ||
    (typeof policy.title === "string" ? policy.title : policy.title[lang]) ||
    "";

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-5 py-6">
      {/* Card polizza */}
      <Card floating className="mx-auto flex w-3/5 flex-col items-center">
        {policy.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={policy.img} alt={title} className="mb-4 max-h-24 max-w-full object-contain" />
        ) : (
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-14 bg-tint text-brand">
            <ShieldCheck size={26} strokeWidth={1.6} />
          </div>
        )}
        <p className="text-center text-[13.5px] font-semibold text-ink">{title}</p>
      </Card>

      {/* Dettagli */}
      <Card>
        <div className="flex items-center justify-between border-b border-border-soft py-2">
          <span className="text-[14px] font-semibold text-ink">{t("policy.nr")}</span>
          <span className="text-[14px] text-ink-2">{policy.nr}</span>
        </div>
        <div className="flex items-center justify-between border-b border-border-soft py-2">
          <span className="text-[14px] font-semibold text-ink">{t("policy.expire")}</span>
          <span className="text-[14px] text-ink-2">
            {policy.endDate ? getDatetimeFromTimestamp(policy.endDate, false, true) : ""}
          </span>
        </div>
        {hasBilling && (
          <div className="flex items-center justify-between py-2">
            <span className="text-[14px] font-semibold text-ink">{t("policy.invoice")}</span>
            <span className="text-right">
              <span className="block text-[14px] text-ink-2">{policy.invoiceamount}</span>
              <span className="block text-[12.5px] text-muted">{policy.invoicedate}</span>
            </span>
          </div>
        )}
      </Card>

      {/* Azioni */}
      <div className="grid grid-cols-2 gap-4">
        {policyDocument?.id !== null && (
          <Button
            variant="secondary"
            icon={<Copy size={16} strokeWidth={1.6} />}
            onClick={() => navigateTo(`file/${policyDocument.id}`)}
          >
            {t("policy.copy")}
          </Button>
        )}
        <Button
          variant="secondary"
          icon={<TriangleAlert size={16} strokeWidth={1.6} />}
          onClick={() => navigateTo(`report/${policy.id}`)}
          className={policyDocument?.id === null ? "col-span-2" : ""}
        >
          {t("policy.report")}
        </Button>
      </div>
      <Button
        fullWidth
        icon={<Phone size={16} strokeWidth={1.6} />}
        onClick={() => navigateTo(`consultant/${policy.id}`)}
      >
        {t("policy.button")}
      </Button>
    </div>
  );
}
