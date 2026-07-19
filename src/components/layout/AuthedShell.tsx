"use client";

/**
 * Chrome delle pagine autenticate (port di layout-authed, ridisegnato):
 * header bianco con profilo | logo | menu-toggle, footer a 3 voci
 * (Supporto / FAQ / Home), superfici bianche e accento unico blu.
 */

import Image from "next/image";
import type { ReactNode } from "react";
import { CircleHelp, House, Menu, Phone, UserRound, X } from "lucide-react";
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

export function AuthedShell({ children }: { children: ReactNode }) {
  const { navigateTo, back, inMenu } = useNavigator();
  const { lang, t } = useI18n();

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-white px-4">
        <button
          type="button"
          onClick={() => navigateTo("profile")}
          className="flex h-10 w-10 items-center justify-center rounded-11 text-ink-2 transition-colors hover:bg-tint-2 hover:text-ink"
          aria-label="Profile"
        >
          <UserRound size={20} strokeWidth={1.6} />
        </button>

        <button
          type="button"
          onClick={() => navigateTo("home")}
          className="flex flex-1 items-center justify-center"
          aria-label="Home"
        >
          <Image
            src="/images/onezone-logo-pos-RGB.svg"
            alt="OneZone"
            width={110}
            height={18}
            className="h-[18px] w-auto"
            priority
          />
        </button>

        {inMenu ? (
          <button
            type="button"
            onClick={back}
            className="flex h-10 w-10 items-center justify-center rounded-11 text-ink-2 transition-colors hover:bg-tint-2 hover:text-ink"
            aria-label="Close"
          >
            <X size={20} strokeWidth={1.6} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigateTo("menu")}
            className="flex h-10 w-10 items-center justify-center rounded-11 text-ink-2 transition-colors hover:bg-tint-2 hover:text-ink"
            aria-label="Menu"
          >
            <Menu size={20} strokeWidth={1.6} />
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto">{children}</main>

      <nav className="grid shrink-0 grid-cols-3 border-t border-border bg-white">
        <FooterButton
          icon={<Phone size={18} strokeWidth={1.6} />}
          label={t("menu.support")}
          onClick={() => navigateTo(statics.LinkOneZoneSupport[lang])}
        />
        <FooterButton
          icon={<CircleHelp size={18} strokeWidth={1.6} />}
          label={t("menu.faq")}
          onClick={() => navigateTo(statics.LinkOneZoneFAQ[lang])}
        />
        <FooterButton
          icon={<House size={18} strokeWidth={1.6} />}
          label={t("menu.home")}
          onClick={() => navigateTo("home")}
        />
      </nav>
    </div>
  );
}
