"use client";

/**
 * Chrome delle pagine non autenticate (port di layout-unauthed, ridisegnato):
 * contenuto centrato; header (logo + ✕) solo nel selettore lingua;
 * footer Supporto / OneZone / Lingua. `showFooter=false` per la rotta
 * pubblica del form preventivi (parità hideFooterNav).
 */

import Image from "next/image";
import type { ReactNode } from "react";
import { ExternalLink, Globe, Phone, X } from "lucide-react";
import { useNavigator } from "@/lib/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import statics from "@/data/statics.json";

function FooterButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-16 flex-col items-center justify-center gap-1 text-brand transition-colors hover:bg-tint-2"
    >
      {icon}
      <span className="text-[11px] font-semibold uppercase tracking-[0.6px]">{label}</span>
    </button>
  );
}

export function UnauthedShell({
  children,
  showFooter = true,
}: {
  children: ReactNode;
  showFooter?: boolean;
}) {
  const { navigateTo, back, inMenu } = useNavigator();
  const { lang, t } = useI18n();

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      {inMenu && (
        <header className="flex shrink-0 items-center justify-between border-b border-border bg-white p-5">
          <Image
            src="/images/onezone-logo-pos-RGB.svg"
            alt="OneZone"
            width={110}
            height={18}
            className="h-[18px] w-auto"
          />
          <button
            type="button"
            onClick={back}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-tint-2 hover:text-ink"
            aria-label="Close"
          >
            <X size={20} strokeWidth={1.6} />
          </button>
        </header>
      )}

      <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>

      {showFooter && (
        <nav className="grid shrink-0 grid-cols-3 border-t border-border bg-white">
          <FooterButton
            icon={<Phone size={18} strokeWidth={1.6} />}
            label={t("menu.support")}
            onClick={() => navigateTo(statics.LinkOneZoneSupport[lang])}
          />
          <FooterButton
            icon={<ExternalLink size={18} strokeWidth={1.6} />}
            label={t("menu.onezone")}
            onClick={() => navigateTo(statics.LinkOneZoneWebsite[lang])}
          />
          <FooterButton
            icon={<Globe size={18} strokeWidth={1.6} />}
            label={t("menu.lang")}
            onClick={() => navigateTo("language_unauthed")}
          />
        </nav>
      )}
    </div>
  );
}
