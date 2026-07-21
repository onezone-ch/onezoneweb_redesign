"use client";

/**
 * Port di consultant-automation.component (/consultant-automation — solo admin):
 * lista consulenti dal backend automazione (via proxy admin), ricerca client-side,
 * badge disabilitato + StatusDot login; modal per consulente con toggle Attivo
 * e toggle per-scraper (optimistic update con rollback su errore).
 * Gate: contact.id ∈ ADMIN_CONTACT_IDS, altrimenti redirect /home.
 */

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import clsx from "clsx";
import { Badge, Button, EmptyState, Input, Modal, StatusDot } from "@/components/ui";
import { UsersRound } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useLoader } from "@/lib/loader/LoaderProvider";
import { useNavigator } from "@/lib/navigation";
import { isAdmin } from "@/lib/auth/roles";
import { publicConfig } from "@/lib/config";
import * as automation from "@/lib/api/automation";
import type { ConsultantItem } from "@/lib/api/automation.types";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="switch"
      aria-checked={on}
      className={clsx(
        "relative h-6 w-11 rounded-full transition-colors",
        on ? "bg-brand" : "bg-border",
      )}
    >
      <span
        className={clsx(
          "absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow-seg transition-transform",
          on ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

export function ConsultantAutomationPage() {
  const { ready, userData } = useAuth();
  const { t } = useI18n();
  const loader = useLoader();
  const { navigateTo } = useNavigator();

  const [consultants, setConsultants] = useState<ConsultantItem[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [selected, setSelected] = useState<ConsultantItem | null>(null);
  const [loaded, setLoaded] = useState(false);
  const started = useRef(false);

  const admin = ready && isAdmin(userData);

  useEffect(() => {
    if (!ready) return;
    if (!admin) {
      navigateTo("home");
      return;
    }
    if (started.current) return;
    started.current = true;
    loader.show();
    automation
      .getConsultants()
      .then((data) => setConsultants(data))
      .catch(() => {})
      .finally(() => {
        setLoaded(true);
        loader.hide();
      });
  }, [ready, admin, loader, navigateTo]);

  const q = searchValue.toLowerCase().trim();
  const filtered = !q
    ? consultants
    : consultants.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.surname.toLowerCase().includes(q) ||
          c.ecohub_username.toLowerCase().includes(q),
      );

  const syncListItem = (updated: ConsultantItem) => {
    setConsultants((list) =>
      list.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
    );
  };

  const isScraperEnabled = (scraper: string): boolean => {
    const lower = scraper.toLowerCase();
    return !selected!.disabled_scrapers.some((s) => s.toLowerCase() === lower);
  };

  const toggleScraper = async (scraper: string) => {
    if (!selected) return;
    const scraperLower = scraper.toLowerCase();
    const isDisabled = selected.disabled_scrapers.some(
      (s) => s.toLowerCase() === scraperLower,
    );
    const newDisabled = isDisabled
      ? selected.disabled_scrapers.filter((s) => s.toLowerCase() !== scraperLower)
      : [...new Set([...selected.disabled_scrapers.map((s) => s.toLowerCase()), scraperLower])];
    const prevDisabled = [...selected.disabled_scrapers];

    setSelected((c) => (c ? { ...c, disabled_scrapers: newDisabled } : c));
    try {
      const updated = await automation.patchConsultant(selected.id, {
        disabled_scrapers: newDisabled,
      });
      setSelected((c) =>
        c ? { ...c, disabled_scrapers: updated.disabled_scrapers ?? newDisabled } : c,
      );
      syncListItem(updated);
    } catch {
      setSelected((c) => (c ? { ...c, disabled_scrapers: prevDisabled } : c));
    }
  };

  const toggleActive = async () => {
    if (!selected) return;
    const newActive = !selected.is_active;
    const prevActive = selected.is_active;
    setSelected((c) => (c ? { ...c, is_active: newActive } : c));
    try {
      const updated = await automation.patchConsultant(selected.id, {
        is_active: newActive,
      });
      setSelected((c) => (c ? { ...c, is_active: updated.is_active ?? newActive } : c));
      syncListItem(updated);
    } catch {
      setSelected((c) => (c ? { ...c, is_active: prevActive } : c));
    }
  };

  if (!admin) return null;

  return (
    <div className="mx-auto flex w-full max-w-[800px] flex-col px-5 py-6">
      <h1 className="mb-5 text-[28px] font-bold tracking-[-0.7px] text-ink">
        {t("menu.consultantManagement")}
      </h1>

      <div className="relative mb-5">
        <Input
          placeholder={t("consultantAutomation.searchPlaceholder")}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
        <Search
          size={18}
          strokeWidth={1.6}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((consultant) => (
          <button
            key={consultant.id}
            type="button"
            onClick={() =>
              setSelected({
                ...consultant,
                disabled_scrapers: [...consultant.disabled_scrapers],
              })
            }
            className="rounded-16 border border-border-soft bg-white p-4 text-left transition-all hover:border-border hover:shadow-card"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="text-[15px] font-bold text-ink">
                {consultant.name} {consultant.surname}
              </h3>
              {!consultant.is_active && (
                <Badge variant="danger">{t("consultantAutomation.disabled")}</Badge>
              )}
            </div>
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-[13px] text-ink-2">
                  {consultant.ecohub_username}
                </p>
                <p className="text-[13px] text-muted">{consultant.commission_number}</p>
              </div>
              <StatusDot status={consultant.login_check ? "success" : "danger"}>
                {t("consultantAutomation.login")}
              </StatusDot>
            </div>
          </button>
        ))}

        {loaded && filtered.length === 0 && (
          <EmptyState
            icon={<UsersRound size={24} strokeWidth={1.6} />}
            title={t("consultantAutomation.empty")}
          />
        )}
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.name} ${selected.surname}` : ""}
      >
        {selected && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-[13.5px] font-medium text-ink-2">
                {t(
                  selected.is_active
                    ? "consultantAutomation.active"
                    : "consultantAutomation.inactive",
                )}
              </span>
              <Toggle on={selected.is_active} onClick={() => void toggleActive()} />
            </div>

            <div className="flex flex-col gap-2">
              {publicConfig.automationScrapers.map((scraper) => (
                <div
                  key={scraper}
                  className="flex items-center justify-between rounded-12 bg-tint-2 px-4 py-2.5"
                >
                  <span className="text-[13.5px] font-medium text-ink">{scraper}</span>
                  <Toggle
                    on={isScraperEnabled(scraper)}
                    onClick={() => void toggleScraper(scraper)}
                  />
                </div>
              ))}
            </div>

            <Button variant="secondary" fullWidth onClick={() => setSelected(null)}>
              {t("consultantAutomation.close")}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
