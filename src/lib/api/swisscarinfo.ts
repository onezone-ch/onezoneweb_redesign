/**
 * Port di swiss-car-info.service.ts.
 * - /v3/search passa dal proxy `/api/swisscarinfo/search` (X-API-Key sul server).
 * Semantica errori preservata: fallback [] / {results:[],total:0} / null.
 */

import type { VehicleResult } from "./automation.types";

const SEARCH_PROXY = "/api/swisscarinfo/search";

export interface VehicleSearchResult {
  results: VehicleResult[];
  total: number;
}

interface SwissCarInfoItem {
  identification: {
    make: string;
    commercial_name: string;
    type_approval: string;
    registration_number?: string;
    date_of_approval?: string;
  };
  engine?: { power_kw?: number; power_hp?: number };
  fuel?: { type_label?: string };
  _source?: string;
  _generation?: number;
}

interface SwissCarInfoResponse {
  success: boolean;
  data: SwissCarInfoItem[];
  meta?: { total: number; page: number };
}

function mapItem(item: SwissCarInfoItem): VehicleResult {
  return {
    make: item.identification?.make ?? "",
    commercial_name: item.identification?.commercial_name ?? "",
    type_approval: item.identification?.type_approval ?? "",
    fuel_type: item.fuel?.type_label,
    power_kw: item.engine?.power_kw,
    power_hp: item.engine?.power_hp,
    date_of_approval: item.identification?.date_of_approval,
    source: item._generation != null ? `TAS Gen${item._generation}` : item._source,
  };
}

async function searchApi(params: URLSearchParams): Promise<SwissCarInfoResponse | null> {
  try {
    const res = await fetch(`${SEARCH_PROXY}?${params.toString()}`);
    if (!res.ok) return null;
    return (await res.json()) as SwissCarInfoResponse;
  } catch (err) {
    console.error("SwissCarInfo search error:", err);
    return null;
  }
}

export async function searchBrands(query: string, lang: string = "de"): Promise<string[]> {
  if (!query.trim()) return [];
  const res = await searchApi(
    new URLSearchParams({ q: query.trim(), type: "brand_model", lang, limit: "30" }),
  );
  if (!res?.success || !res.data) return [];
  const seen = new Set<string>();
  const brands: string[] = [];
  for (const item of res.data) {
    const make = item.identification?.make;
    if (make && !seen.has(make)) {
      seen.add(make);
      brands.push(make);
    }
  }
  return brands.sort();
}

export async function searchVehicles(
  brandQuery: string,
  modelQuery: string,
  page: number,
  perPage: number,
  lang: string = "de",
): Promise<VehicleSearchResult> {
  const q = [brandQuery.trim(), modelQuery.trim()].filter(Boolean).join(" ");
  if (!q) return { results: [], total: 0 };
  const res = await searchApi(
    new URLSearchParams({
      q,
      type: "brand_model",
      lang,
      limit: String(perPage),
      page: String(page),
    }),
  );
  if (!res?.success || !res.data) return { results: [], total: 0 };
  const results = res.data.map(mapItem);
  return { results, total: res.meta?.total ?? results.length };
}

export async function searchByTypeApproval(
  query: string,
  page: number,
  perPage: number,
  lang: string = "de",
): Promise<VehicleSearchResult> {
  if (!query.trim()) return { results: [], total: 0 };
  const res = await searchApi(
    new URLSearchParams({
      q: query.trim(),
      type: "variant",
      lang,
      limit: String(perPage),
      page: String(page),
    }),
  );
  if (!res?.success || !res.data) return { results: [], total: 0 };
  const results = res.data.map(mapItem);
  return { results, total: res.meta?.total ?? results.length };
}

export async function searchBySerial(
  serial: string,
  lang: string = "de",
): Promise<VehicleResult | null> {
  const res = await searchApi(
    new URLSearchParams({ q: serial.trim(), type: "matricule", lang }),
  );
  if (!res?.success || !res.data || res.data.length === 0) return null;
  return { ...mapItem(res.data[0]), source: "matricule" };
}
