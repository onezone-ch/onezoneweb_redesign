"use client";

/**
 * Port di consultant.component (/consultant, /consultant/:policyid):
 * card del consulente (pointOfContact dell'utente) con email/telefono/mobile
 * cliccabili (mailto:/tel:).
 */

import { Mail, Phone, Smartphone, UserRound } from "lucide-react";
import { Card } from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function ConsultantPage({ policyid }: { policyid?: string }) {
  const { userData } = useAuth();
  const { t } = useI18n();

  const poc = (userData.pointOfContact ?? {}) as {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    phoneMobile?: string;
    avatar?: string;
  };

  const rows = [
    { value: poc.email, icon: <Mail size={18} strokeWidth={1.6} />, href: `mailto:${poc.email}` },
    { value: poc.phone, icon: <Phone size={18} strokeWidth={1.6} />, href: `tel:${poc.phone}` },
    { value: poc.phoneMobile, icon: <Smartphone size={18} strokeWidth={1.6} />, href: `tel:${poc.phoneMobile}` },
  ].filter((r) => r.value);

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-5 py-6">
      <h1 className="text-[28px] font-bold tracking-[-0.7px] text-ink">
        {t("help.title")}
      </h1>

      <Card floating>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="mb-1 text-[12.5px] text-muted">{t("help.contact")}</p>
            <h2 className="text-[18px] font-bold tracking-[-0.4px] text-ink">
              {poc.firstName} {poc.lastName}
            </h2>
            {policyid && <p className="mt-1 text-[12.5px] text-muted">#{policyid}</p>}
          </div>
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-14 bg-tint">
            {poc.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={poc.avatar}
                alt={`${poc.firstName} ${poc.lastName}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound size={30} strokeWidth={1.6} className="text-brand" />
            )}
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <a
            key={row.href}
            href={row.href}
            className="flex items-center gap-4 rounded-16 border border-border-soft bg-white p-4 transition-all hover:border-border hover:shadow-card"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-11 bg-tint text-brand">
              {row.icon}
            </span>
            <span className="text-[14.5px] font-medium text-ink">{row.value}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
