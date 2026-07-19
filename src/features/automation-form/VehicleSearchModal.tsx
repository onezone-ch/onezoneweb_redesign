"use client";

/**
 * Modal ricerca veicolo (port della `modal` di automation-form):
 * tre modalità mutuamente esclusive — matricola (9 cifre, auto-search),
 * n. omologazione (≥6 char, auto-search debounce 300), marca+filtri
 * (autocomplete brand SwissCarInfo → dropdown modelli da action=filters,
 * potenza min/max, Filtra/Reset — doc 2026-07-16).
 * Tabella risultati sticky-header con paginazione (5 pagine visibili).
 */

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Button, Input, Modal, Spinner } from "@/components/ui";
import { useI18n } from "@/lib/i18n/I18nProvider";
import * as sci from "@/lib/api/swisscarinfo";
import type { VehicleResult } from "@/lib/api/automation.types";

type SearchType = "brand_filters" | "variant" | "matricule";

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
  const [serialQuery, setSerialQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [filteredModels, setFilteredModels] = useState<string[]>([]);
  const [modelFilterQuery, setModelFilterQuery] = useState("");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");
  const [powerMin, setPowerMin] = useState("");
  const [powerMax, setPowerMax] = useState("");
  const [results, setResults] = useState<VehicleResult[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const perPage = 10;
  const lastSearchType = useRef<SearchType>("brand_filters");
  const brandDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const taDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // reset completo all'apertura
  useEffect(() => {
    if (!open) return;
    setTypeApprovalQuery("");
    setBrandQuery("");
    setSerialQuery("");
    setSelectedBrand("");
    setBrandSuggestions([]);
    setShowBrandDropdown(false);
    setModels([]);
    setFilteredModels([]);
    setModelFilterQuery("");
    setShowModelDropdown(false);
    setSelectedModel("");
    setPowerMin("");
    setPowerMax("");
    setResults([]);
    setPage(1);
    setTotal(0);
    setSearched(false);
    lastSearchType.current = "brand_filters";
  }, [open]);

  const totalPages = Math.ceil(total / perPage);
  const visiblePages = (() => {
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  })();

  const parsePower = (v: string): number | null => {
    const trimmed = (v ?? "").trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  };

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

  const applyFilters = async (targetPage = 1) => {
    const brand = selectedBrand.trim();
    if (!brand) return;
    setSearched(true);
    setLoading(true);
    lastSearchType.current = "brand_filters";
    const { results: r, total: tot } = await sci.searchVehiclesByBrand(brand, {
      model: selectedModel || undefined,
      powerMin: parsePower(powerMin),
      powerMax: parsePower(powerMax),
      page: targetPage,
      perPage,
      lang,
    });
    setResults(r);
    setTotal(tot);
    setPage(targetPage);
    setLoading(false);
  };

  const goToPage = (target: number) => {
    if (target < 1 || target > totalPages || target === page) return;
    if (lastSearchType.current === "variant") void searchByTypeApproval(target);
    else void applyFilters(target);
  };

  // ── Input handlers (mutuamente esclusivi, parità) ────────────────────────
  const onTypeApprovalInput = (value: string) => {
    setTypeApprovalQuery(value);
    if (value.length > 0) {
      setBrandQuery("");
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
      setBrandSuggestions([]);
      setShowBrandDropdown(false);
    }
    if (value.length === 9) void searchBySerial();
  };

  const onBrandInput = (value: string) => {
    setBrandQuery(value);
    if (value !== selectedBrand) {
      setSelectedBrand("");
      setModels([]);
      setFilteredModels([]);
      setSelectedModel("");
      setModelFilterQuery("");
      setShowModelDropdown(false);
      setPowerMin("");
      setPowerMax("");
    }
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

  const selectBrand = async (brand: string) => {
    setBrandQuery(brand);
    setSelectedBrand(brand);
    setBrandSuggestions([]);
    setShowBrandDropdown(false);
    setSelectedModel("");
    setModelFilterQuery("");
    setPowerMin("");
    setPowerMax("");
    setModels([]);
    setFilteredModels([]);
    setFiltersLoading(true);
    const { models: m } = await sci.getBrandFilters(brand, lang);
    setModels(m);
    setFilteredModels([...m]);
    setFiltersLoading(false);
  };

  const onModelFilterInput = (value: string) => {
    setModelFilterQuery(value);
    if (value !== selectedModel) setSelectedModel("");
    const q = (value ?? "").trim().toLowerCase();
    setFilteredModels(q ? models.filter((m) => m.toLowerCase().includes(q)) : [...models]);
    setShowModelDropdown(true);
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

        {/* Marca + filtri */}
        <div className="relative">
          <Input
            label={t("automation.form_brand")}
            placeholder={t("automation.vehicle_search_brand_placeholder")}
            value={brandQuery}
            onChange={(e) => onBrandInput(e.target.value)}
            onBlur={() => setTimeout(() => setShowBrandDropdown(false), 200)}
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
                    void selectBrand(brand);
                  }}
                >
                  {brand}
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedBrand && (
          <div className="rounded-14 bg-tint-2 p-4">
            <p className="mb-3 text-[12.5px] text-muted">
              {t("automation.vehicle_search_filter_hint")}
            </p>
            {filtersLoading ? (
              <Spinner />
            ) : (
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Input
                    label={t("automation.vehicle_search_filter_model_label")}
                    placeholder={t("automation.vehicle_search_filter_model_placeholder")}
                    value={modelFilterQuery}
                    onChange={(e) => onModelFilterInput(e.target.value)}
                    onFocus={() => {
                      setFilteredModels(modelFilterQuery.trim() ? filteredModels : [...models]);
                      setShowModelDropdown(true);
                    }}
                    onBlur={() => setTimeout(() => setShowModelDropdown(false), 200)}
                    autoComplete="off"
                  />
                  {showModelDropdown && filteredModels.length > 0 && (
                    <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-12 border border-border-soft bg-white shadow-float">
                      {filteredModels.map((model) => (
                        <li
                          key={model}
                          className="cursor-pointer border-t border-border-soft px-[14px] py-[10px] text-[14px] first:border-t-0 hover:bg-tint-2"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedModel(model);
                            setModelFilterQuery(model);
                            setShowModelDropdown(false);
                          }}
                        >
                          {model}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={t("automation.vehicle_search_filter_power_min_label")}
                    inputMode="numeric"
                    value={powerMin}
                    onChange={(e) => setPowerMin(e.target.value)}
                  />
                  <Input
                    label={t("automation.vehicle_search_filter_power_max_label")}
                    inputMode="numeric"
                    value={powerMax}
                    onChange={(e) => setPowerMax(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => void applyFilters(1)}>
                    {t("automation.vehicle_search_btn_filter")}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedModel("");
                      setModelFilterQuery("");
                      setPowerMin("");
                      setPowerMax("");
                      setFilteredModels([...models]);
                    }}
                  >
                    {t("automation.vehicle_search_btn_reset")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

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
