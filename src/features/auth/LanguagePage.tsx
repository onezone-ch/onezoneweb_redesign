"use client";

/**
 * Port di language.component — selettore lingua condiviso tra
 * /language (authed) e /language_unauthed.
 * Da loggati salva anche la lingua sul contatto BrokerStar (id numerico).
 * Niente window.location.reload: il context i18n re-renderizza tutto.
 */

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n, type Language } from "@/lib/i18n/I18nProvider";
import { useLoader } from "@/lib/loader/LoaderProvider";
import * as brokerstar from "@/lib/api/brokerstar";
import { toaster } from "@/lib/toaster";

const LANGUAGE_OPTIONS: { id: number; code: Language; name: string }[] = [
  { id: 1, code: "de", name: "german" },
  { id: 2, code: "fr", name: "french" },
  { id: 3, code: "it", name: "italian" },
  { id: 4, code: "en", name: "english" },
];

export function LanguagePage() {
  const { isLogged, userData } = useAuth();
  const { lang, setLang, t } = useI18n();
  const loader = useLoader();
  const [open, setOpen] = useState(false);

  const selected =
    LANGUAGE_OPTIONS.find((l) => l.code === lang) ?? LANGUAGE_OPTIONS[0];
  const choices = LANGUAGE_OPTIONS.filter((l) => l.code !== lang);

  const selectLanguage = async (option: (typeof LANGUAGE_OPTIONS)[number]) => {
    setOpen(false);
    setLang(option.code);

    if (isLogged() && userData.contact?.id) {
      loader.show();
      try {
        await brokerstar.changeContact(String(userData.contact.id), {
          language: option.id,
        });
        toaster.success(t("profile", "success"));
      } catch (error) {
        toaster.alert(t("profile", "error"));
        console.log(error);
      } finally {
        loader.hide();
      }
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col px-6 py-8">
      <h1 className="mb-8 text-center text-[28px] font-bold tracking-[-0.7px] text-ink">
        {t("language.selectlanguage")}
      </h1>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 items-center justify-between rounded-12 border border-border bg-white px-[14px] text-[15px] font-medium text-ink transition-colors hover:bg-tint-2"
        aria-expanded={open}
      >
        {t(`language.${selected.name}`)}
        {open ? (
          <ChevronUp size={18} strokeWidth={1.6} className="text-muted" />
        ) : (
          <ChevronDown size={18} strokeWidth={1.6} className="text-muted" />
        )}
      </button>

      {open && (
        <Card className="mt-3 overflow-hidden p-0">
          {choices.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => void selectLanguage(option)}
              className="block w-full border-t border-border-soft px-4 py-[14px] text-left text-[14.5px] font-medium text-ink transition-colors first:border-t-0 hover:bg-tint-2"
            >
              {t(`language.${option.name}`)}
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}
