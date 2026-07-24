/**
 * Port di automation.service.ts — il client parla SOLO con i propri proxy
 * `/api/automation/*` e `/api/localities` (le chiavi segrete stanno sul server).
 * La api_key del consulente (non segreta, per-utente) resta in localStorage
 * con la stessa chiave `consultantApiKey`.
 */

import { storage } from "@/lib/storage";
import type {
  CheckLoginResponse,
  ConsultantItem,
  ConsultantRegistrationPayload,
  ConsultantRegistrationResponse,
  CredentialsUpdateResponse,
  EcoHubSetupPayload,
  ExtractTotpResponse,
  GenerateQuotesResponse,
  GetConsultantResponse,
  LocalityEntry,
  PatchConsultantPayload,
  QuoteRequestPayload,
  QuoteRequestPayloadResponse,
  QuoteRequestStatus,
  StreetEntry,
} from "./automation.types";

const PROXY = "/api/automation";
const OPENPLZ_STREETS_URL = "https://openplzapi.org/ch/Streets";
const OPENPLZ_STREET_NAME_RE = /^[\p{L}\d\s.\-']+$/u;

export class AutomationError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`Automation request failed (${status})`);
  }
}

async function request<T>(
  method: "GET" | "POST" | "PATCH",
  path: string,
  options: { body?: unknown; formData?: FormData; consultantKey?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.consultantKey) {
    const apiKey = storage.getItem("consultantApiKey");
    if (!apiKey) {
      throw new Error("Consultant API key not found. Please complete the setup first.");
    }
    headers["x-consultant-api-key"] = apiKey;
  }
  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }
  const res = await fetch(`${PROXY}/${path}`, { method, headers, body });
  if (!res.ok) {
    let parsed: unknown;
    try {
      parsed = await res.json();
    } catch {
      parsed = undefined;
    }
    throw new AutomationError(res.status, parsed);
  }
  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Consulenti (via proxy, admin key lato server)

export async function registerConsultant(
  payload: ConsultantRegistrationPayload,
): Promise<ConsultantRegistrationResponse> {
  const res = await request<ConsultantRegistrationResponse>("POST", "consultants", {
    body: payload,
  });
  storage.setItem("consultantApiKey", res.api_key);
  return res;
}

export async function getConsultant(onezoneId: string): Promise<GetConsultantResponse> {
  const res = await request<GetConsultantResponse>("GET", `consultants/${onezoneId}`);
  storage.setItem("consultantApiKey", res.api_key);
  return res;
}

export async function checkLogin(consultantId: string): Promise<CheckLoginResponse> {
  return request("POST", `consultants/${consultantId}/verify-login`, { body: {} });
}

export async function extractTotp(qrImage: File): Promise<ExtractTotpResponse> {
  const formData = new FormData();
  formData.append("qr_image", qrImage);
  return request("POST", "extract-totp-secret", { formData });
}

export async function updateConsultant(
  payload: EcoHubSetupPayload,
): Promise<CredentialsUpdateResponse> {
  const { consultant_id, ...credentials } = payload;
  return request("POST", `consultants/${consultant_id}/credentials`, {
    body: credentials,
  });
}

export async function patchConsultant(
  id: number,
  payload: PatchConsultantPayload,
): Promise<ConsultantItem> {
  return request("PATCH", `consultants/${id}`, { body: payload });
}

export async function getConsultants(): Promise<ConsultantItem[]> {
  return request("GET", "consultants");
}

export function hasConsultantApiKey(): boolean {
  return !!storage.getItem("consultantApiKey");
}

// ---------------------------------------------------------------------------
// Preventivi

export async function submitQuoteRequest(
  payload: QuoteRequestPayload,
  usePublicConsultant = false,
): Promise<GenerateQuotesResponse> {
  if (usePublicConsultant) {
    // la chiave del consulente pubblico è risolta interamente server-side
    return request("POST", "public/generate-quotes", { body: payload });
  }
  return request("POST", "generate-quotes", { body: payload, consultantKey: true });
}

export async function getQuoteRequestStatus(
  requestId: number,
  usePublicConsultant = false,
): Promise<QuoteRequestStatus> {
  if (usePublicConsultant) {
    return request("GET", `public/quote-requests/${requestId}`);
  }
  return request("GET", `quote-requests/${requestId}`, { consultantKey: true });
}

/**
 * Recupera il payload di una richiesta esistente per precompilare il form
 * (pulsante "Modifica e riprocessa" della dashboard). Solo flusso consulente:
 * l'ownership è applicata dal backend tramite la api_key consulente.
 */
export async function getQuoteRequestPayload(
  requestId: number,
): Promise<QuoteRequestPayloadResponse> {
  return request("GET", `quote-requests/${requestId}/payload`, { consultantKey: true });
}

// ---------------------------------------------------------------------------
// Località (CSV lato server) + vie (openplzapi, pubblica, client-side)

export async function getLocalitiesByPlz(plz: string): Promise<LocalityEntry[]> {
  try {
    const res = await fetch(`/api/localities?plz=${encodeURIComponent(plz)}`);
    if (!res.ok) return [];
    return (await res.json()) as LocalityEntry[];
  } catch {
    return [];
  }
}

export async function searchByPlz(plz: string): Promise<LocalityEntry[]> {
  try {
    const res = await fetch(`/api/localities?plz=${encodeURIComponent(plz)}&prefix=1`);
    if (!res.ok) return [];
    return (await res.json()) as LocalityEntry[];
  } catch {
    return [];
  }
}

export async function searchStreets(
  name: string,
  postalCode: string,
  locality: string,
): Promise<StreetEntry[]> {
  const trimmed = (name || "").trim();
  if (!trimmed || !OPENPLZ_STREET_NAME_RE.test(trimmed)) return [];
  const params = new URLSearchParams({
    name: trimmed,
    postalCode,
    locality,
    page: "1",
    pageSize: "20",
  });
  try {
    const res = await fetch(`${OPENPLZ_STREETS_URL}?${params.toString()}`);
    if (!res.ok) return [];
    const arr = (await res.json()) as Array<{
      name: string;
      postalCode: string;
      locality: string;
      canton?: { key?: string };
    }>;
    return (arr || []).map((s) => ({
      name: s.name,
      postalCode: s.postalCode,
      locality: s.locality,
      canton: s.canton?.key || "",
    }));
  } catch {
    return [];
  }
}
