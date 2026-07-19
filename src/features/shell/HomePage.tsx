"use client";

/**
 * Port di home.component:
 * - carousel banner WordPress (cache-first `bannerData`);
 * - saluto personalizzato + testo di aiuto;
 * - bottone consulente "Genera Preventivi" con verify-login cache-first
 *   (`consultantLoginCheck`, timeout 90s → toast) → automation-form/setup;
 *   ("Invia mandato" resta nascosto, parità col sorgente);
 * - menu dinamico `customerportalmenu` (livello 3 consulenti, 1 clienti);
 * - citazione random da `quotation` (cache localStorage).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, HScroll, ListCard, ListRow, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useLoader } from "@/lib/loader/LoaderProvider";
import { useNavigator } from "@/lib/navigation";
import { isTrue } from "@/lib/helper";
import { storage } from "@/lib/storage";
import * as brokerstar from "@/lib/api/brokerstar";
import * as automation from "@/lib/api/automation";
import { banner } from "@/lib/api/onezone";
import { toaster } from "@/lib/toaster";

interface Slide {
  id: number;
  image: string;
  title: string;
  text: string;
  "button-link": string;
  "button-text": string;
}

interface MenuEntry {
  name: Record<string, string>;
  url: Record<string, string>;
}

interface Quote {
  header: string | Record<string, string>;
  body: string | Record<string, string>;
  footer: string | Record<string, string>;
}

function parseCache<T>(key: string): T | null {
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function HomePage() {
  const { userData, getUserName } = useAuth();
  const { lang, t } = useI18n();
  const loader = useLoader();
  const { navigateTo } = useNavigator();

  const isConsultant = isTrue(
    (userData.login as { isSharer?: unknown } | undefined)?.isSharer,
  );

  const [slider, setSlider] = useState<Slide[]>([]);
  const [menu, setMenu] = useState<MenuEntry[]>([]);
  const [quote, setQuote] = useState<Quote>({ header: "", body: "", footer: "" });
  const [isVerifying, setIsVerifying] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    // Banner (cache-first `bannerData`)
    const mapSlides = (data: { app_data: Slide }[]): Slide[] =>
      data.map((slide, idx) => ({ ...slide.app_data, id: idx }));
    const cachedBanner = parseCache<{ app_data: Slide }[]>("bannerData");
    if (Array.isArray(cachedBanner)) {
      setSlider(mapSlides(cachedBanner));
    } else {
      loader.show();
      banner()
        .then((response) => {
          if (Array.isArray(response)) {
            storage.setItem("bannerData", JSON.stringify(response));
            setSlider(mapSlides(response as { app_data: Slide }[]));
          }
        })
        .finally(() => loader.hide());
    }

    // Menu (livello 3 per consulenti, 1 per clienti)
    const menuType = isTrue(
      (userData.login as { isSharer?: unknown } | undefined)?.isSharer,
    )
      ? 3
      : 1;
    loader.show();
    brokerstar
      .customerportalmenu(menuType)
      .then((response) => setMenu((response as MenuEntry[]) || []))
      .finally(() => loader.hide());

    // Citazione random
    brokerstar.quotation().then((response) => {
      const data = (response as { data?: Quote[] })?.data;
      if (data && data.length > 0) {
        setQuote(data[Math.floor(Math.random() * data.length)]);
      }
    });

    // Consulente: api_key dal backend automazione (cache-first `consultantData`)
    if (isConsultant) {
      const onezoneId = String(userData.contact?.id);
      const cached = parseCache<{ api_key?: string; disabled_scrapers?: string[] }>(
        "consultantData",
      );
      if (cached?.api_key) {
        storage.setItem("consultantApiKey", cached.api_key);
        storage.setItem(
          "consultantDisabledScrapers",
          JSON.stringify(cached.disabled_scrapers || []),
        );
      } else {
        automation
          .getConsultant(onezoneId)
          .then((res) => {
            storage.setItem("consultantData", JSON.stringify(res));
            storage.setItem(
              "consultantDisabledScrapers",
              JSON.stringify(res.disabled_scrapers || []),
            );
          })
          .catch(() => {
            // consulente non registrato nel sistema automazione: ignora
          });
      }
    }
  }, [isConsultant, loader, userData]);

  const onGeneraPreventivi = useCallback(async () => {
    const consultantId = userData.contact?.id;
    if (!consultantId) return;

    // cache-first: salta verify-login se già verificato
    const cached = parseCache<{ login_check?: boolean }>("consultantLoginCheck");
    if (cached && typeof cached.login_check === "boolean") {
      navigateTo(cached.login_check ? "automation-form" : "automation-setup");
      return;
    }

    setIsVerifying(true);
    try {
      const result = await Promise.race([
        automation.checkLogin(String(consultantId)),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(Object.assign(new Error(), { name: "TimeoutError" })), 90000),
        ),
      ]);
      storage.setItem("consultantLoginCheck", JSON.stringify(result));
      navigateTo(result.login_check ? "automation-form" : "automation-setup");
    } catch (err) {
      if ((err as Error)?.name === "TimeoutError") {
        toaster.warn(
          "Login su EcoHub FALLITO. Ripetere la procedura. Se il problema persiste, contattare il webmaster.",
        );
      } else {
        // 404 = consulente non registrato, qualsiasi altro errore → setup
        navigateTo("automation-setup");
      }
    } finally {
      setIsVerifying(false);
    }
  }, [userData, navigateTo]);

  const localized = (text: string | Record<string, string>): string => {
    if (typeof text === "string") return text;
    return text[lang] || Object.values(text)[0] || "";
  };

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-6 px-5 py-6">
      {/* Carousel banner */}
      {slider.length > 0 && (
        <HScroll className="-mx-5 px-5">
          <div className="flex gap-4">
            {slider.map((slide) => (
              <div
                key={slide.id}
                className="relative h-[200px] w-[325px] flex-none overflow-hidden rounded-18 shadow-card"
              >
                {/* immagini remote da WordPress: img nativo */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-ink/45" />
                <div className="relative flex h-full flex-col justify-between p-4 text-white">
                  <div>
                    <h3 className="text-[18px] font-bold leading-tight tracking-[-0.4px]">
                      {slide.title}
                    </h3>
                    <p className="mt-1 text-[13px] leading-relaxed opacity-90">
                      {slide.text}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTo(slide["button-link"])}
                    className="self-start rounded-12 bg-white px-4 py-2 text-[13px] font-semibold text-brand transition-colors hover:bg-tint"
                  >
                    {slide["button-text"]}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </HScroll>
      )}

      {/* Saluto */}
      <div>
        <h1 className="text-[32px] font-bold leading-tight tracking-[-1px] text-ink">
          {t("index.welcome")}
          {getUserName()}
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
          {t("index.welcomeHelp")}
        </p>
      </div>

      {/* Bottone consulente */}
      {isConsultant && (
        <ListCard>
          <ListRow
            title={t("automation.genera_preventivi")}
            onClick={isVerifying ? undefined : () => void onGeneraPreventivi()}
            chevron
          />
        </ListCard>
      )}

      {/* Verifica login in corso */}
      {isVerifying && (
        <Card className="flex items-center gap-3 bg-tint-2">
          <Spinner />
          <p className="text-[13.5px] font-medium text-ink-2">
            Verifica dati in corso, ci vorrà circa 1 minuto.
            <br />
            Attendere, non chiudere o ricaricare la pagina.
          </p>
        </Card>
      )}

      {/* Menu dinamico */}
      {menu.length > 0 && (
        <ListCard>
          {menu.map((entry, i) => (
            <ListRow
              key={i}
              title={entry.name[lang]}
              onClick={() => navigateTo(entry.url[lang])}
              chevron
            />
          ))}
        </ListCard>
      )}

      {/* Citazione */}
      {localized(quote.body) && (
        <div className="rounded-16 bg-tint-2 p-6">
          <blockquote className="text-[13.5px] italic leading-relaxed text-ink-2">
            &ldquo;{localized(quote.body)}&rdquo;
          </blockquote>
          <cite className="mt-3 block text-right text-[13px] font-medium not-italic text-muted">
            ~ {localized(quote.footer)}
          </cite>
        </div>
      )}
    </div>
  );
}
