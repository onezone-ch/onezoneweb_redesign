"use client";

/**
 * Port di customers-mandate-policies.component (/customers-mandate-policies/:id):
 * - carica contatto (con retry ×3 per la race post-creazione share, poi reload);
 * - se manca il mandato (o non-prod): upload PDF mandato + multi-checkbox
 *   assicuratori → uploadProfileFile + mandateInformInsurances(isNew=true);
 * - griglia polizze del cliente raggruppate.
 */

import { useEffect, useRef, useState } from "react";
import { Check, FileText, FileUp } from "lucide-react";
import clsx from "clsx";
import { Button, Card, EmptyState } from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useLoader } from "@/lib/loader/LoaderProvider";
import { useNavigator } from "@/lib/navigation";
import * as brokerstar from "@/lib/api/brokerstar";
import { toaster } from "@/lib/toaster";
import { PolicyCard, type PolicyItem } from "@/features/policies/PolicyCard";
import { loadAvatarDataUrl } from "@/features/policies/insuranceAvatar";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

interface PolicyByClient {
  name: string;
  clientPolicies: (PolicyItem & { contactname: string })[];
}

interface Insurance {
  id: number;
  name: string;
  selected: boolean;
}

export function CustomersMandatePoliciesPage({ id }: { id: string }) {
  const { getUserName } = useAuth();
  const { lang, t } = useI18n();
  const loader = useLoader();
  const { navigateTo } = useNavigator();

  const [policiesByClient, setPoliciesByClient] = useState<PolicyByClient[]>([]);
  const [contactname, setContactname] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [hasMandateFile, setHasMandateFile] = useState(true);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [mandatePdfFile, setMandatePdfFile] = useState<File | null>(null);
  const contactLoginId = useRef(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // Polizze del cliente
    const loadPolicies = async () => {
      loader.show();
      try {
        const response = (await brokerstar.policyList({ contact: id })) as {
          data?: Record<string, unknown>[];
        };
        const policies = (response.data || []).map((policy) => {
          const p = policy as {
            id: number;
            contact: { name: string };
            insurance: { id: number };
            branch: { name: Record<string, string> };
            insuredCars?: { plate: string }[];
          };
          return {
            id: p.id,
            contactname: p.contact.name,
            insurance: p.insurance.id,
            title: p.branch.name,
            licencePlate:
              p.insuredCars && p.insuredCars.length > 0 ? p.insuredCars[0].plate : null,
          };
        });
        const grouped: PolicyByClient[] = [];
        policies.forEach((policy) => {
          const client = grouped.find((item) => item.name === policy.contactname);
          if (client) client.clientPolicies.push(policy);
          else grouped.push({ name: policy.contactname, clientPolicies: [policy] });
        });
        setPoliciesByClient(grouped);
        setLoaded(true);
        policies.forEach((policy) => {
          void loadAvatarDataUrl(policy.insurance).then((img) => {
            if (!img) return;
            setPoliciesByClient((prev) =>
              prev.map((group) => ({
                ...group,
                clientPolicies: group.clientPolicies.map((p) =>
                  p.insurance === policy.insurance ? { ...p, img } : p,
                ),
              })),
            );
          });
        });
      } finally {
        loader.hide();
      }
    };

    // Contatto con retry (race post-creazione: GET può tornare 403 → {})
    const loadContact = async (attempt = 0) => {
      loader.show();
      const response = (await brokerstar.contact(Number(id))) as {
        contactType?: { id: number };
        name1?: unknown;
        name2?: unknown;
        hasMandateFile?: boolean;
        permissions?: { id?: number };
      };
      if (!response || !response.contactType) {
        if (attempt < 2) {
          setTimeout(() => void loadContact(attempt + 1), 1000);
          return;
        }
        window.location.reload();
        return;
      }
      loader.hide();
      setContactname(
        getUserName(response.contactType.id, String(response.name1), String(response.name2)),
      );
      const mandate = response.hasMandateFile ?? true;
      setHasMandateFile(mandate);
      contactLoginId.current = response.permissions?.id ?? 0;
      if (!mandate || !IS_PRODUCTION) {
        const ins = (await brokerstar.insurance()) as {
          data?: { id: number; name: string }[];
        };
        setInsurances(
          (ins.data || []).map((i) => ({ id: i.id, name: i.name, selected: false })),
        );
      }
    };

    void loadPolicies();
    void loadContact();
  }, [id, loader, getUserName]);

  const submitMandate = async () => {
    if (!mandatePdfFile) {
      toaster.warn("Bitte eine PDF-Datei auswählen");
      return;
    }
    if (!insurances.some((i) => i.selected)) {
      toaster.warn(t("agreement", "selectInsurance"));
      return;
    }
    loader.show();
    try {
      await brokerstar.uploadProfileFile(
        { currentUploadEntryid: 1, profileid: id, currentLanguage: lang },
        mandatePdfFile,
      );
      const insurancesMap = insurances
        .filter((i) => i.selected)
        .reduce<Record<string, boolean>>((acc, curr) => {
          acc[curr.id] = true;
          return acc;
        }, {});
      void brokerstar.mandateInformInsurances(true, insurancesMap, contactLoginId.current);
      toaster.success(t("agreement", "successsend"));
      navigateTo("home");
    } catch {
      toaster.alert("Fehler beim Hochladen des Mandats");
    } finally {
      loader.hide();
    }
  };

  const showMandateSection = !hasMandateFile || !IS_PRODUCTION;

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col px-5 py-6">
      <h1 className="mb-6 text-[28px] font-bold tracking-[-0.7px] text-ink">
        {contactname}
      </h1>

      {showMandateSection && (
        <Card className="mb-8">
          <div className="mb-[7px] text-[12.5px] font-medium tracking-[0.1px] text-muted">
            {t("agreement.uploadMandate")}
          </div>
          <label
            className={clsx(
              "flex cursor-pointer flex-col items-center gap-2 rounded-14 border border-dashed p-6 transition-colors",
              mandatePdfFile
                ? "border-brand bg-tint"
                : "border-border bg-tint-2 hover:bg-tint",
            )}
          >
            <FileUp
              size={28}
              strokeWidth={1.6}
              className={mandatePdfFile ? "text-brand" : "text-muted"}
            />
            <p
              className={clsx(
                "text-center text-[12.5px]",
                mandatePdfFile ? "font-semibold text-brand" : "text-muted",
              )}
            >
              {mandatePdfFile ? mandatePdfFile.name : t("agreement.uploadMandateHint")}
            </p>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => setMandatePdfFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <p className="mb-3 mt-5 text-[13px] leading-relaxed text-ink-2">
            {t("policy-add.text")}
          </p>
          <div className="mb-5 max-h-64 overflow-y-auto rounded-14 border border-border-soft">
            {insurances.map((insurance) => (
              <button
                key={insurance.id}
                type="button"
                onClick={() =>
                  setInsurances((list) =>
                    list.map((i) =>
                      i.id === insurance.id ? { ...i, selected: !i.selected } : i,
                    ),
                  )
                }
                className={clsx(
                  "flex w-full items-center justify-between border-t border-border-soft px-4 py-3 text-left transition-colors first:border-t-0",
                  insurance.selected ? "bg-tint" : "hover:bg-tint-2",
                )}
              >
                <span
                  className={clsx(
                    "truncate text-[14px] font-medium",
                    insurance.selected ? "text-brand" : "text-ink",
                  )}
                >
                  {insurance.name}
                </span>
                <span
                  className={clsx(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
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

          <Button fullWidth onClick={() => void submitMandate()}>
            {t("agreement.send")}
          </Button>
        </Card>
      )}

      {policiesByClient.map((clientPolicies) => (
        <div key={clientPolicies.name} className="mb-8">
          <h2 className="mb-4 text-[15px] font-semibold text-ink-2">
            {t("policies.policen")} {clientPolicies.name}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {clientPolicies.clientPolicies.map((policy) => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                lang={lang}
                onClick={() => navigateTo(`policy/${policy.id}`)}
              />
            ))}
          </div>
        </div>
      ))}

      {loaded && policiesByClient.length === 0 && (
        <EmptyState
          icon={<FileText size={24} strokeWidth={1.6} />}
          title={t("policies.empty")}
        />
      )}
    </div>
  );
}
