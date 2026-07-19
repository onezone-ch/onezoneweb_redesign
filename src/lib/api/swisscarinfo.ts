/**
 * Port di swiss-car-info.service.ts.
 * - /v3/search passa dal proxy `/api/swisscarinfo/search` (X-API-Key sul server);
 * - brands.php è pubblico (nessuna chiave) e resta chiamato direttamente.
 * Semantica errori preservata: fallback [] / {results:[],total:0} / null.
 */

import type { VehicleResult } from "./automation.types";

const SEARCH_PROXY = "/api/swisscarinfo/search";
const BRANDS_API_URL =
  process.env.NEXT_PUBLIC_SWISSCARINFO_BRANDS_URL ??
  "https://swisscarinfo.ch/assets/api/brands.php";

export interface VehicleSearchResult {
  results: VehicleResult[];
  total: number;
}

export interface BrandFilters {
  models: string[];
  fuels: { code: string; label: string }[];
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

// ---------------------------------------------------------------------------
// brands.php (pubblica, senza chiave — chiamata diretta come nell'originale)

interface BrandFiltersResponse {
  success: boolean;
  brand: string;
  models?: string[];
  fuels?: { code: string; label: string }[];
}

interface BrandVehicleItem {
  brand: string;
  model: string;
  variant?: string;
  approval_number?: string;
  fuel?: string;
  power_kw?: number;
  approval_date?: string;
  power_formatted?: string;
  fuel_translated?: string;
  source?: string;
}

interface BrandVehiclesResponse {
  success: boolean;
  results: BrandVehicleItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getBrandFilters(
  brand: string,
  lang: string = "de",
): Promise<BrandFilters> {
  if (!brand.trim()) return { models: [], fuels: [] };
  try {
    const params = new URLSearchParams({ action: "filters", brand: brand.trim(), lang });
    const res = await fetch(`${BRANDS_API_URL}?${params.toString()}`);
    if (!res.ok) return { models: [], fuels: [] };
    const data = (await res.json()) as BrandFiltersResponse;
    return {
      models: Array.isArray(data?.models) ? data.models : [],
      fuels: Array.isArray(data?.fuels) ? data.fuels : [],
    };
  } catch (err) {
    console.error("SwissCarInfo getBrandFilters error:", err);
    return { models: [], fuels: [] };
  }
}

export async function searchVehiclesByBrand(
  brand: string,
  opts: {
    model?: string;
    powerMin?: number | null;
    powerMax?: number | null;
    page: number;
    perPage: number;
    lang: string;
  },
): Promise<VehicleSearchResult> {
  if (!brand.trim()) return { results: [], total: 0 };
  const params = new URLSearchParams({
    action: "vehicles",
    brand: brand.trim(),
    page: String(opts.page),
    limit: String(opts.perPage),
    lang: opts.lang,
    sort: "model",
    dir: "asc",
  });
  if (opts.model && opts.model.trim()) params.set("model", opts.model.trim());
  if (opts.powerMin != null && !Number.isNaN(opts.powerMin)) {
    params.set("power_min", String(opts.powerMin));
  }
  if (opts.powerMax != null && !Number.isNaN(opts.powerMax)) {
    params.set("power_max", String(opts.powerMax));
  }
  try {
    const res = await fetch(`${BRANDS_API_URL}?${params.toString()}`);
    if (!res.ok) return { results: [], total: 0 };
    const data = (await res.json()) as BrandVehiclesResponse;
    if (!data?.success || !Array.isArray(data.results)) return { results: [], total: 0 };
    const results: VehicleResult[] = data.results.map((item) => {
      const hpMatch = item.power_formatted
        ? /\((\d+)\s*ch\)/i.exec(item.power_formatted)
        : null;
      const powerHp = hpMatch ? Number(hpMatch[1]) : undefined;
      const typeApproval =
        item.approval_number && item.approval_number.trim()
          ? item.approval_number.trim()
          : (item.variant ?? "");
      let dateIso: string | undefined;
      if (item.approval_date && /^\d{2}\.\d{2}\.\d{4}$/.test(item.approval_date)) {
        const [dd, mm, yyyy] = item.approval_date.split(".");
        dateIso = `${yyyy}-${mm}-${dd}`;
      }
      return {
        make: item.brand ?? "",
        commercial_name: item.model ?? "",
        type_approval: typeApproval,
        fuel_type: item.fuel_translated,
        power_kw: item.power_kw,
        power_hp: powerHp,
        date_of_approval: dateIso,
        source: item.source,
      };
    });
    return { results, total: data.total ?? results.length };
  } catch (err) {
    console.error("SwissCarInfo searchVehiclesByBrand error:", err);
    return { results: [], total: 0 };
  }
}
