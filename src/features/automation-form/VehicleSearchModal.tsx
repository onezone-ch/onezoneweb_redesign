"use client";

/**
 * Modal ricerca veicolo (port della `modal` di automation-form):
 * tre modalità mutuamente esclusive — matricola (9 cifre, auto-search),
 * n. omologazione (≥6 char, auto-search debounce 300), marca + modello
 * (input libero, marca con autocomplete SwissCarInfo) + Cerca.
 * Tabella risultati sticky-header con paginazione (5 pagine visibili).
 */

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Button, Input, Modal, Spinner } from "@/components/ui";
import { useI18n } from "@/lib/i18n/I18nProvider";
import * as sci from "@/lib/api/swisscarinfo";
import type { VehicleResult } from "@/lib/api/automation.types";

type SearchType = "brand_model" | "variant" | "matricule";

export interface VehicleSelection {
  result: VehicleResult;
  searchType: SearchType;
  serialQuery: string;
}

export function VehicleSearchModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (selection: VehicleSelection) => void;
}) {
  const { lang, t } = useI18n();

  const [typeApprovalQuery, setTypeApprovalQuery] = useState("");
  const [brandQuery, setBrandQuery] = useState("");
  const [modelQuery, setModelQuery] = useState("");
  const [serialQuery, setSerialQuery] = useState("");
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [results, setResults] = useState<VehicleResult[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const perPage = 10;
  const lastSearchType = useRef<SearchType>("brand_model");
  const brandDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const taDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // reset completo all'apertura
  useEffect(() => {
    if (!open) return;
    setTypeApprovalQuery("");
    setBrandQuery("");
    setModelQuery("");
    setSerialQuery("");
    setBrandSuggestions([]);
    setShowBrandDropdown(false);
    setResults([]);
    setPage(1);
    setTotal(0);
    setSearched(false);
    lastSearchType.current = "brand_model";
  }, [open]);

  const totalPages = Math.ceil(total / perPage);
  const visiblePages = (() => {
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  })();

  const searchByTypeApproval = async (targetPage: number) => {
    setSearched(true);
    setLoading(true);
    lastSearchType.current = "variant";
    const { results: r, total: tot } = await sci.searchByTypeApproval(
      typeApprovalQuery.trim(),
      targetPage,
      perPage,
      lang,
    );
    setResults(r);
    setTotal(tot);
    setPage(targetPage);
    setLoading(false);
  };

  const searchBySerial = async () => {
    setSearched(true);
    setLoading(true);
    lastSearchType.current = "matricule";
    const result = await sci.searchBySerial(serialQuery.trim(), lang);
    setResults(result ? [result] : []);
    setTotal(result ? 1 : 0);
    setLoading(false);
  };

  const searchByBrandModel = async (targetPage = 1) => {
    if (!brandQuery.trim() && !modelQuery.trim()) return;
    setSearched(true);
    setLoading(true);
    lastSearchType.current = "brand_model";
    const { results: r, total: tot } = await sci.searchVehicles(
      brandQuery,
      modelQuery,
      targetPage,
      perPage,
      lang,
    );
    setResults(r);
    setTotal(tot);
    setPage(targetPage);
    setLoading(false);
  };

  const goToPage = (target: number) => {
    if (target < 1 || target > totalPages || target === page) return;
    if (lastSearchType.current === "variant") void searchByTypeApproval(target);
    else void searchByBrandModel(target);
  };

  // ── Input handlers (mutuamente esclusivi, parità) ────────────────────────
  const onTypeApprovalInput = (value: string) => {
    setTypeApprovalQuery(value);
    if (value.length > 0) {
      setBrandQuery("");
      setModelQuery("");
      setSerialQuery("");
      setBrandSuggestions([]);
      setShowBrandDropdown(false);
    }
    if (taDebounce.current) clearTimeout(taDebounce.current);
    if (value.trim().length >= 6) {
      taDebounce.current = setTimeout(() => void searchByTypeApproval(1), 300);
    }
  };

  const onSerialInput = (value: string) => {
    setSerialQuery(value);
    if (value.length > 0) {
      setTypeApprovalQuery("");
      setBrandQuery("");
      setModelQuery("");
      setBrandSuggestions([]);
      setShowBrandDropdown(false);
    }
    if (value.length === 9) void searchBySerial();
  };

  const onBrandInput = (value: string) => {
    setBrandQuery(value);
    if (value.length > 0) {
      setSerialQuery("");
      setTypeApprovalQuery("");
    }
    if (brandDebounce.current) clearTimeout(brandDebounce.current);
    if (value.length >= 2) {
      brandDebounce.current = setTimeout(async () => {
        const brands = await sci.searchBrands(value, lang);
        setBrandSuggestions(brands);
        setShowBrandDropdown(brands.length > 0);
      }, 350);
    } else {
      setBrandSuggestions([]);
      setShowBrandDropdown(false);
    }
  };

  const onModelInput = (value: string) => {
    setModelQuery(value);
    if (value.length > 0) {
      setSerialQuery("");
      setTypeApprovalQuery("");
    }
  };

  const selectBrand = (brand: string) => {
    setBrandQuery(brand);
    setBrandSuggestions([]);
    setShowBrandDropdown(false);
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}.${month}.${year}`;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("automation.vehicle_search_title")}
      maxWidth="720px"
    >
      <div className="flex flex-col gap-4">
        {/* Matricola */}
        <Input
          label={t("automation.vehicle_search_serial_label")}
          placeholder={t("automation.vehicle_search_serial_placeholder")}
          value={serialQuery}
          inputMode="numeric"
          maxLength={9}
          onChange={(e) => onSerialInput(e.target.value)}
        />
        <div className="text-center text-[12px] font-semibold uppercase tracking-[0.6px] text-muted">
          {t("automation.vehicle_search_or_divider")}
        </div>
        {/* N. omologazione */}
        <Input
          label={t("automation.vehicle_search_type_approval_label")}
          placeholder={t("automation.vehicle_search_type_approval_placeholder")}
          value={typeApprovalQuery}
          onChange={(e) => onTypeApprovalInput(e.target.value)}
        />
        <div className="text-center text-[12px] font-semibold uppercase tracking-[0.6px] text-muted">
          {t("automation.vehicle_search_or_divider")}
        </div>

        {/* Marca + Modello + Cerca */}
        <div className="flex items-end gap-3">
          <div className="relative flex-1">
            <Input
              label={t("automation.form_brand")}
              placeholder={t("automation.vehicle_search_brand_placeholder")}
              value={brandQuery}
              onChange={(e) => onBrandInput(e.target.value)}
              onBlur={() => setTimeout(() => setShowBrandDropdown(false), 200)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void searchByBrandModel(1);
              }}
              autoComplete="off"
            />
            {showBrandDropdown && (
              <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-12 border border-border-soft bg-white shadow-float">
                {brandSuggestions.map((brand) => (
                  <li
                    key={brand}
                    className="cursor-pointer border-t border-border-soft px-[14px] py-[10px] text-[14px] first:border-t-0 hover:bg-tint-2"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectBrand(brand);
                    }}
                  >
                    {brand}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex-1">
            <Input
              label={t("automation.form_model")}
              placeholder={t("automation.vehicle_search_model_placeholder")}
              value={modelQuery}
              onChange={(e) => onModelInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void searchByBrandModel(1);
              }}
              autoComplete="off"
            />
          </div>
          <Button className="shrink-0" onClick={() => void searchByBrandModel(1)}>
            {t("automation.vehicle_search_btn_search")}
          </Button>
        </div>

        {/* Risultati */}
        {loading && (
          <div className="flex items-center gap-2 text-[13px] text-muted">
            <Spinner size={16} /> {t("automation.vehicle_search_loading")}
          </div>
        )}
        {!loading && searched && results.length === 0 && (
          <p className="text-[13px] text-muted">
            {t("automation.vehicle_search_no_results")}
          </p>
        )}
        {!loading && results.length > 0 && (
          <>
            <div className="max-h-[320px] overflow-auto rounded-14 border border-border-soft">
              <table className="w-full text-[12.5px]">
                <thead className="sticky top-0 bg-tint-2 text-left">
                  <tr>
                    {[
                      t("automation.form_brand"),
                      t("automation.form_model"),
                      t("automation.vehicle_search_col_type_approval"),
                      t("automation.vehicle_search_col_fuel"),
                      t("automation.vehicle_search_col_power"),
                      t("automation.vehicle_search_col_date"),
                    ].map((h) => (
                      <th key={h} className="whitespace-nowrap px-3 py-2 font-semibold text-ink-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr
                      key={`${r.type_approval}-${i}`}
                      className="cursor-pointer border-t border-border-soft transition-colors hover:bg-tint"
                      onClick={() =>
                        onSelect({
                          result: r,
                          searchType: lastSearchType.current,
                          serialQuery: serialQuery.trim(),
                        })
                      }
                    >
                      <td className="px-3 py-2 font-medium text-ink">{r.make}</td>
                      <td className="px-3 py-2">{r.commercial_name}</td>
                      <td className="px-3 py-2">{r.type_approval}</td>
                      <td className="px-3 py-2">{r.fuel_type}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {r.power_kw ? `${r.power_kw} kW` : ""}
                        {r.power_hp ? ` (${r.power_hp} CV)` : ""}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {formatDate(r.date_of_approval)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted">
                {t("automation.vehicle_search_results_total")} {total}
              </span>
              {totalPages > 1 && (
                <div className="flex gap-1">
                  {visiblePages.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => goToPage(p)}
                      className={clsx(
                        "h-8 w-8 rounded-10 text-[13px] font-semibold transition-colors",
                        p === page
                          ? "bg-brand text-white"
                          : "bg-tint-2 text-ink-2 hover:bg-tint",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
