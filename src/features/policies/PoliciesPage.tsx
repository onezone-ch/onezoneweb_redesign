"use client";

/**
 * Port di policies.component: lista polizze raggruppate per cliente
 * (vista personale o /policies/:clientid), avatar assicurazioni async,
 * bottone "aggiungi" solo su vista personale, empty state.
 */

import { useEffect, useRef, useState } from "react";
import { FileText, Plus } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useLoader } from "@/lib/loader/LoaderProvider";
import { useNavigator } from "@/lib/navigation";
import * as brokerstar from "@/lib/api/brokerstar";
import { PolicyCard, type PolicyItem } from "./PolicyCard";
import { loadAvatarDataUrl } from "./insuranceAvatar";

interface PolicyByClient {
  name: string;
  clientPolicies: (PolicyItem & { contactname: string })[];
}

export function PoliciesPage({ clientid }: { clientid?: string }) {
  const { getUserName } = useAuth();
  const { lang, t } = useI18n();
  const loader = useLoader();
  const { navigateTo } = useNavigator();

  const [policiesByClient, setPoliciesByClient] = useState<PolicyByClient[]>([]);
  const [contactname, setContactname] = useState("");
  const [loaded, setLoaded] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const load = async () => {
      loader.show();
      try {
        const params: Record<string, string> = clientid ? { contact: clientid } : {};
        const response = (await brokerstar.policyList(params)) as {
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
            licencePlate: p.insuredCars && p.insuredCars.length > 0 ? p.insuredCars[0].plate : null,
            selected: false,
          };
        });

        // raggruppa per cliente
        const grouped: PolicyByClient[] = [];
        policies.forEach((policy) => {
          const client = grouped.find((item) => item.name === policy.contactname);
          if (client) {
            client.clientPolicies.push(policy);
          } else {
            grouped.push({ name: policy.contactname, clientPolicies: [policy] });
          }
        });
        setPoliciesByClient(grouped);
        setLoaded(true);

        // avatar async
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

      if (clientid) {
        loader.show();
        try {
          const response = (await brokerstar.contact(Number(clientid))) as {
            contactType?: { id: number };
            name1?: string;
            name2?: string;
          };
          setContactname(
            getUserName(
              response.contactType?.id,
              String(response.name1),
              String(response.name2),
            ),
          );
        } finally {
          loader.hide();
        }
      }
    };
    void load();
  }, [clientid, loader, getUserName]);

  return (
    <div className="mx-auto flex w-full max-w-[800px] flex-col px-5 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[28px] font-bold tracking-[-0.7px] text-ink">
          {contactname || t("policies.title")}
        </h1>
        {!contactname && (
          <Button
            size="sm"
            variant="ghost"
            icon={<Plus size={14} strokeWidth={1.6} />}
            onClick={() => navigateTo("policyadd")}
          >
            {t("policies.add")}
          </Button>
        )}
      </div>

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
