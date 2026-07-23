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
import type { FuelOption } from "@/lib/api/swisscarinfo";
import type { VehicleResult } from "@/lib/api/automation.types";

type SearchType = "brand_model" | "variant" | "matricule" | "filter";

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
  // ── Barra filtri (Modello / Carburante / Potenza) ────────────────────────
  const [modalModels, setModalModels] = useState<string[]>([]);
  const [modalFuels, setModalFuels] = useState<FuelOption[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [fuel, setFuel] = useState("");
  const [powerMin, setPowerMin] = useState("");
  const [powerMax, setPowerMax] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const perPage = 10;
  const lastSearchType = useRef<SearchType>("filter");
  const brandDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const taDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredModels = modelSearch.trim()
    ? modalModels.filter((m) => m.toLowerCase().includes(modelSearch.toLowerCase()))
    : modalModels;

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
    setModalModels([]);
    setModalFuels([]);
    setModelsLoading(false);
    setFuel("");
    setPowerMin("");
    setPowerMax("");
    setModelSearch("");
    setShowModelDropdown(false);
    lastSearchType.current = "filter";
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

  const applyFilters = async (
    targetPage = 1,
    override?: { model?: string; fuel?: string },
  ) => {
    if (!brandQuery.trim()) return;
    setSearched(true);
    setLoading(true);
    lastSearchType.current = "filter";
    const { results: r, total: tot } = await sci.filterVehicles(
      brandQuery,
      override?.model ?? modelQuery,
      override?.fuel ?? fuel,
      powerMin,
      powerMax,
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
    else void applyFilters(target);
  };

  // ── Barra filtri: carica liste, seleziona modello, filtra/reset ──────────
  const loadModelsFuels = async (brand: string) => {
    setModelQuery("");
    setModelSearch("");
    setFuel("");
    setPowerMin("");
    setPowerMax("");
    setModalModels([]);
    setModalFuels([]);
    setResults([]);
    setSearched(false);
    setModelsLoading(true);
    const { models, fuels } = await sci.getModelsFuels(brand, "", lang);
    setModalModels(models);
    setModalFuels(fuels);
    setModelsLoading(false);
  };

  const selectModel = async (model: string) => {
    setModelQuery(model);
    setModelSearch(model);
    setShowModelDropdown(false);
    // restringe i carburanti a marca+modello
    const { fuels } = await sci.getModelsFuels(brandQuery, model, lang);
    setModalFuels(fuels);
    const nextFuel = fuel && !fuels.some((f) => f.code === fuel) ? "" : fuel;
    setFuel(nextFuel);
    void applyFilters(1, { model, fuel: nextFuel });
  };

  const resetFilters = () => {
    setModelQuery("");
    setModelSearch("");
    setFuel("");
    setPowerMin("");
    setPowerMax("");
    setResults([]);
    setTotal(0);
    setSearched(false);
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

  const selectBrand = (brand: string) => {
    setBrandQuery(brand);
    setBrandSuggestions([]);
    setShowBrandDropdown(false);
    void loadModelsFuels(brand);
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

        {/* Marca (autocomplete) + barra filtri esatti */}
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
                    selectBrand(brand);
                  }}
                >
                  {brand}
                </li>
              ))}
            </ul>
          )}
        </div>

        {brandQuery.trim() && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {/* Modello: dropdown ricercabile */}
              <div className="relative">
                <label className="mb-1 block text-[12px] font-semibold text-ink-2">
                  {t("automation.vehicle_filter_model_label")}
                </label>
                <input
                  className="h-[42px] w-full rounded-12 border border-border-soft bg-white px-[14px] text-[14px] outline-none focus:border-brand"
                  placeholder={t("automation.vehicle_filter_model_all")}
                  value={modelSearch}
                  onChange={(e) => {
                    setModelSearch(e.target.value);
                    if (!e.target.value.trim()) setModelQuery("");
                    setShowModelDropdown(true);
                  }}
                  onFocus={() => setShowModelDropdown(true)}
                  onBlur={() => setTimeout(() => setShowModelDropdown(false), 200)}
                  autoComplete="off"
                />
                {showModelDropdown && filteredModels.length > 0 && (
                  <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-12 border border-border-soft bg-white shadow-float">
                    {filteredModels.map((m) => (
                      <li
                        key={m}
                        className="cursor-pointer border-t border-border-soft px-[14px] py-[10px] text-[14px] first:border-t-0 hover:bg-tint-2"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          void selectModel(m);
                        }}
                      >
                        {m}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {/* Carburante: select dinamico */}
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-ink-2">
                  {t("automation.vehicle_filter_fuel_label")}
                </label>
                <select
                  className="h-[42px] w-full rounded-12 border border-border-soft bg-white px-[14px] text-[14px] outline-none focus:border-brand"
                  value={fuel}
                  onChange={(e) => setFuel(e.target.value)}
                >
                  <option value="">{t("automation.vehicle_filter_fuel_all")}</option>
                  {modalFuels.map((f) => (
                    <option key={f.code} value={f.code}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              {/* Potenza kW min/max */}
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-ink-2">
                  {t("automation.vehicle_filter_power_min_label")}
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="h-[42px] w-full rounded-12 border border-border-soft bg-white px-[14px] text-[14px] outline-none focus:border-brand"
                  value={powerMin}
                  onChange={(e) => setPowerMin(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-ink-2">
                  {t("automation.vehicle_filter_power_max_label")}
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="h-[42px] w-full rounded-12 border border-border-soft bg-white px-[14px] text-[14px] outline-none focus:border-brand"
                  value={powerMax}
                  onChange={(e) => setPowerMax(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => void applyFilters(1)} disabled={modelsLoading}>
                {t("automation.vehicle_filter_btn_filter")}
              </Button>
              <Button variant="ghost" onClick={resetFilters}>
                {t("automation.vehicle_filter_btn_reset")}
              </Button>
            </div>
          </>
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
