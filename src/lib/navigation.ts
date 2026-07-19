"use client";

/**
 * Port di navigator.service.ts.
 * - navigateTo accetta stringhe, oggetti menu con destinationUrl{,E,I,F}
 *   (suffisso lingua), link app:// e URL esterni (nuova tab);
 * - back() usa la history del browser;
 * - `inMenu` è derivato dal pathname (=/menu, /language_unauthed) invece che
 *   da un flag imperativo: stesso comportamento del toggle header, meno stato.
 */

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useI18n, type Language } from "@/lib/i18n/I18nProvider";

type Destination = string | Record<string, string>;

function languageSuffix(lang: Language): string {
  switch (lang) {
    case "en":
      return "E";
    case "it":
      return "I";
    case "fr":
      return "F";
    case "de":
    default:
      return "";
  }
}

export function resolveDestination(destination: Destination, lang: Language): string {
  let link: string;
  if (destination instanceof Object) {
    link =
      destination[`destinationUrl${languageSuffix(lang)}`] || destination["destinationUrl"];
  } else {
    link = destination;
  }
  if (link.indexOf("app://home") > -1) {
    link = link.replace("app://home", "");
  }
  if (link.indexOf("app://") > -1) {
    link = link.replace("app://", "");
  }
  return link;
}

export function useNavigator() {
  const router = useRouter();
  const pathname = usePathname();
  const { lang } = useI18n();

  const navigateTo = useCallback(
    (destination: Destination) => {
      const link = resolveDestination(destination, lang);
      if (link.indexOf("http") === -1) {
        router.push(`/${link.replace(/^\//, "")}`);
      } else {
        window.open(link, "_blank");
      }
    },
    [router, lang],
  );

  const back = useCallback(() => {
    router.back();
  }, [router]);

  /** true quando siamo nel menu (header mostra ✕ invece di ≡) */
  const inMenu = pathname === "/menu" || pathname === "/language_unauthed";

  return { navigateTo, back, inMenu, pathname };
}
