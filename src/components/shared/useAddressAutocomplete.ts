"use client";

/**
 * Hook condiviso per l'autocomplete indirizzo svizzero (CAP → Località → Via).
 * Port della logica di register/customers-mandate-add/automation-form:
 * - CAP: ricerca per prefisso da /api/localities (≥2 cifre);
 * - Località: proposte per CAP esatto (4 cifre), dropdown se >1;
 * - Via: openplzapi con debounce 350ms, ≥3 char, solo se CAP+località validi;
 * - validazione: CAP 4 cifre esistente, località appartenente al CAP,
 *   via scelta tra quelle proposte dall'API (set validAddresses);
 * - navigazione tastiera ArrowUp/Down/Home/End/Enter/Escape (doc 2026-07-06).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getLocalitiesByPlz,
  searchByPlz,
  searchStreets,
} from "@/lib/api/automation";
import type { LocalityEntry, StreetEntry } from "@/lib/api/automation.types";

export type DropdownKind = "plz" | "area" | "address";

export interface AddressValues {
  postCode: string;
  city: string;
  address: string;
}

export interface AddressAutocompleteOptions {
  /** Chiamato quando l'utente seleziona un CAP o una località (per es. per impostare il cantone). */
  onSelectLocality?: (entry: LocalityEntry) => void;
}

export function useAddressAutocomplete(options: AddressAutocompleteOptions = {}) {
  const { onSelectLocality } = options;
  const [values, setValues] = useState<AddressValues>({
    postCode: "",
    city: "",
    address: "",
  });

  const [plzSuggestions, setPlzSuggestions] = useState<LocalityEntry[]>([]);
  const [areaSuggestions, setAreaSuggestions] = useState<LocalityEntry[]>([]);
  const [streetSuggestions, setStreetSuggestions] = useState<StreetEntry[]>([]);
  const [openDropdown, setOpenDropdown] = useState<DropdownKind | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [addressLoading, setAddressLoading] = useState(false);
  /** Incrementato quando cambiano le cache di validazione (località/vie) — utile come dep per ricalcolare errori. */
  const [cacheVersion, setCacheVersion] = useState(0);

  /** Località note per il CAP corrente (cache per validazione sincrona). */
  const localitiesForPlz = useRef<LocalityEntry[]>([]);
  const validAddresses = useRef<Set<string>>(new Set());
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStreetQuery = useRef("");

  const close = useCallback(() => {
    setOpenDropdown(null);
    setActiveIndex(-1);
  }, []);

  /** Chiusura ritardata per permettere il click sulle voci (parità setTimeout 200). */
  const closeSoon = useCallback(() => {
    setTimeout(close, 200);
  }, [close]);

  const resetAddressContext = useCallback(() => {
    setStreetSuggestions([]);
    validAddresses.current.clear();
    setValues((v) => (v.address ? { ...v, address: "" } : v));
  }, []);

  const refreshLocalitiesCache = useCallback(async (plz: string) => {
    if (plz.length === 4) {
      localitiesForPlz.current = await getLocalitiesByPlz(plz);
    } else {
      localitiesForPlz.current = [];
    }
    setCacheVersion((n) => n + 1);
  }, []);

  // ── CAP ──────────────────────────────────────────────────────────────────
  const onPlzInput = useCallback(
    async (value: string) => {
      setValues((v) => ({ ...v, postCode: value }));
      resetAddressContext();
      void refreshLocalitiesCache(value);
      if (value.length >= 2) {
        const suggestions = await searchByPlz(value);
        setPlzSuggestions(suggestions);
        setOpenDropdown(suggestions.length > 0 ? "plz" : null);
      } else {
        setPlzSuggestions([]);
        setOpenDropdown(null);
      }
      setActiveIndex(-1);
    },
    [resetAddressContext, refreshLocalitiesCache],
  );

  const selectPlz = useCallback(
    (entry: LocalityEntry) => {
      setValues((v) => ({ ...v, postCode: entry.plz, city: entry.locality }));
      setPlzSuggestions([]);
      close();
      resetAddressContext();
      void refreshLocalitiesCache(entry.plz);
      onSelectLocality?.(entry);
    },
    [close, resetAddressContext, refreshLocalitiesCache, onSelectLocality],
  );

  // ── Località ─────────────────────────────────────────────────────────────
  const onAreaFocus = useCallback(async () => {
    const plz = values.postCode;
    if (plz.length === 4) {
      const localities = await getLocalitiesByPlz(plz);
      localitiesForPlz.current = localities;
      setAreaSuggestions(localities);
      if (localities.length > 1) {
        setOpenDropdown("area");
      }
    }
    setActiveIndex(-1);
  }, [values.postCode]);

  const onAreaInput = useCallback(
    (value: string) => {
      setValues((v) => ({ ...v, city: value }));
      resetAddressContext();
      setActiveIndex(-1);
    },
    [resetAddressContext],
  );

  const selectArea = useCallback(
    (entry: LocalityEntry) => {
      setValues((v) => ({ ...v, city: entry.locality }));
      setAreaSuggestions([]);
      close();
      resetAddressContext();
      onSelectLocality?.(entry);
    },
    [close, resetAddressContext, onSelectLocality],
  );

  // ── Via ──────────────────────────────────────────────────────────────────
  const canQueryStreets = useCallback((): boolean => {
    const plz = values.postCode;
    const area = values.city.trim();
    if (plz.length !== 4 || area.length === 0) return false;
    const localities = localitiesForPlz.current;
    if (localities.length === 0) return false;
    return localities.some((l) => l.locality === area);
  }, [values.postCode, values.city]);

  const onAddressInput = useCallback(
    (value: string) => {
      setValues((v) => ({ ...v, address: value }));
      if (!canQueryStreets() || value.length < 3) {
        setStreetSuggestions([]);
        setOpenDropdown((d) => (d === "address" ? null : d));
        setActiveIndex(-1);
        return;
      }
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(async () => {
        if (value === lastStreetQuery.current) return;
        lastStreetQuery.current = value;
        setAddressLoading(true);
        const streets = await searchStreets(value, values.postCode, values.city);
        streets.forEach((s) => validAddresses.current.add(s.name.toLowerCase()));
        setCacheVersion((n) => n + 1);
        setStreetSuggestions(streets);
        setOpenDropdown(streets.length > 0 ? "address" : null);
        setActiveIndex(-1);
        setAddressLoading(false);
      }, 350);
    },
    [canQueryStreets, values.postCode, values.city],
  );

  const selectStreet = useCallback(
    (s: StreetEntry) => {
      validAddresses.current.add(s.name.toLowerCase());
      setValues((v) => ({ ...v, address: s.name }));
      setStreetSuggestions([]);
      close();
    },
    [close],
  );

  /**
   * Imposta un indirizzo già noto e lo marca come validato (CAP, località e via),
   * caricando la cache località. Usato per prefill programmatici (es. dati di test).
   */
  const setResolvedAddress = useCallback(
    async (postCode: string, city: string, address: string) => {
      setValues({ postCode, city, address });
      const localities = await getLocalitiesByPlz(postCode);
      localitiesForPlz.current = localities;
      if (address.trim()) validAddresses.current.add(address.trim().toLowerCase());
      setCacheVersion((n) => n + 1);
      const entry = localities.find((l) => l.locality === city) ?? localities[0];
      if (entry) onSelectLocality?.(entry);
    },
    [onSelectLocality],
  );

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // ── Navigazione tastiera ─────────────────────────────────────────────────
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent, kind: DropdownKind) => {
      if (openDropdown !== kind) return;
      const items: (LocalityEntry | StreetEntry)[] =
        kind === "plz"
          ? plzSuggestions
          : kind === "area"
            ? areaSuggestions
            : streetSuggestions;
      if (items.length === 0) return;
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setActiveIndex((i) => (i + 1) % items.length);
          break;
        case "ArrowUp":
          event.preventDefault();
          setActiveIndex((i) => (i - 1 + items.length) % items.length);
          break;
        case "Home":
          event.preventDefault();
          setActiveIndex(0);
          break;
        case "End":
          event.preventDefault();
          setActiveIndex(items.length - 1);
          break;
        case "Enter":
          if (activeIndex >= 0 && activeIndex < items.length) {
            event.preventDefault();
            const item = items[activeIndex];
            if (kind === "plz") selectPlz(item as LocalityEntry);
            else if (kind === "area") selectArea(item as LocalityEntry);
            else selectStreet(item as StreetEntry);
          }
          break;
        case "Escape":
          event.preventDefault();
          close();
          break;
      }
    },
    [
      openDropdown,
      plzSuggestions,
      areaSuggestions,
      streetSuggestions,
      activeIndex,
      selectPlz,
      selectArea,
      selectStreet,
      close,
    ],
  );

  // ── Validazione (port di checkData) ──────────────────────────────────────
  const isPlzValid = useCallback((): boolean => {
    return /^\d{4}$/.test(values.postCode) && localitiesForPlz.current.length > 0;
  }, [values.postCode]);

  const isCityValid = useCallback((): boolean => {
    const city = values.city.trim();
    return localitiesForPlz.current.some((l) => l.locality === city);
  }, [values.city]);

  const isAddressValid = useCallback((): boolean => {
    return validAddresses.current.has(values.address.trim().toLowerCase());
  }, [values.address]);

  return {
    values,
    setValues,
    cacheVersion,
    plzSuggestions,
    areaSuggestions,
    streetSuggestions,
    openDropdown,
    activeIndex,
    addressLoading,
    onPlzInput,
    selectPlz,
    onAreaFocus,
    onAreaInput,
    selectArea,
    onAddressInput,
    selectStreet,
    setResolvedAddress,
    onKeyDown,
    closeSoon,
    canQueryStreets,
    isPlzValid,
    isCityValid,
    isAddressValid,
  };
}

export type AddressAutocomplete = ReturnType<typeof useAddressAutocomplete>;
