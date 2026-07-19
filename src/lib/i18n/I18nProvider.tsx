"use client";

/**
 * Port di i18n.service.ts + i18nfile.service.ts.
 * - 4 lingue (de default, fr, it, en), JSON importati staticamente.
 * - Risoluzione: localStorage `selectedLanguage` (incl. valori legacy
 *   english/french/italian) → lingua browser → default de.
 * - `t(...groups)` replica getTranslation: chiave puntata, fallback MISSINGTRANSLATION.
 * - Cambio lingua a runtime: aggiorna il context (re-render React, niente reload).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { storage } from "@/lib/storage";
import { isString, isset } from "@/lib/helper";

import de from "./messages/de.json";
import en from "./messages/en.json";
import fr from "./messages/fr.json";
import it from "./messages/it.json";

export type Language = "de" | "en" | "fr" | "it";

export const LANGUAGES: Language[] = ["de", "en", "fr", "it"];
const DEFAULT_LANGUAGE: Language = "de";

const MESSAGES: Record<Language, Record<string, unknown>> = { de, en, fr, it };

/** Port di getSelectedLanguage: mapping valori legacy + fallback browser. */
export function resolveLanguage(): Language {
  const stored = storage.getItem("selectedLanguage");
  switch (stored) {
    case "en":
    case "english":
      return "en";
    case "fr":
    case "french":
      return "fr";
    case "it":
    case "italian":
      return "it";
    case "de":
      return "de";
  }
  // Nessuna lingua salvata: prova la lingua del browser (match esatto, poi prefisso)
  if (typeof navigator !== "undefined") {
    const browserLang = navigator.language || "";
    const exact = LANGUAGES.find((l) => l === browserLang);
    if (exact) return exact;
    const byPrefix = LANGUAGES.find((l) => l.slice(0, 2) === browserLang.slice(0, 2));
    if (byPrefix) return byPrefix;
  }
  return DEFAULT_LANGUAGE;
}

/** Port di getTypeAsNummeric — usato nei payload BrokerStar. */
export function langToNumeric(lang: Language): number {
  switch (lang) {
    case "en":
      return 4;
    case "fr":
      return 2;
    case "it":
      return 3;
    case "de":
    default:
      return 1;
  }
}

/** Port di getTranslation: accetta gruppi separati o una chiave puntata. */
function getTranslation(messages: Record<string, unknown>, groups: string[]): string {
  let group: Record<string, unknown> = messages;
  const keys = groups.flatMap((g) => g.split("."));
  while (keys.length !== 0) {
    const key = keys.shift() as string;
    if (!isset(group[key])) {
      break;
    }
    if (isString(group[key])) {
      return group[key] as string;
    }
    group = group[key] as Record<string, unknown>;
  }
  return "MISSINGTRANSLATION";
}

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (...groups: string[]) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // Parte con il default (uguale su server e client per l'hydration),
  // poi risolve la lingua reale al mount.
  const [lang, setLangState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    setLangState(resolveLanguage());
  }, []);

  const setLang = useCallback((next: Language) => {
    storage.setItem("selectedLanguage", next);
    setLangState(next);
  }, []);

  const t = useCallback(
    (...groups: string[]) => getTranslation(MESSAGES[lang], groups),
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

/** Shorthand: `const t = useT(); t("menu.home")` */
export function useT(): I18nContextValue["t"] {
  return useI18n().t;
}
