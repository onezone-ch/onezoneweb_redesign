/**
 * Port di brokerstar.service.ts (Angular) — client fetch verso BrokerStar API v3.
 *
 * Semantica errori PRESERVATA dall'originale:
 * - la maggior parte delle funzioni non lancia mai: su errore logga e restituisce
 *   il fallback che l'originale produceva con `catchError(() => of(fallback))`
 *   (le pagine dipendono da questi valori: [], {}, undefined);
 * - `login` e `registerUser` NON hanno fallback: lanciano `BrokerstarError`
 *   con status e body (violation per-campo mostrate dai form).
 *
 * Il token è stato mantenuto come stato di modulo (parità con
 * `brokerstarService.token`), impostato da AuthProvider.
 */

import { publicConfig } from "@/lib/config";
import { storage } from "@/lib/storage";
import { isset } from "@/lib/helper";

const API = publicConfig.brokerstarApiUrl;

let token = "";

export function setBrokerstarToken(newToken: string): void {
  token = newToken;
}

export class BrokerstarError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`BrokerStar request failed (${status})`);
  }
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { Authorization: `Bearer ${token}`, ...extra };
}

/** GET con fallback silenzioso (equivalente catchError → of(fallback)). */
async function bsGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API}${path}`, { headers: authHeaders() });
    if (!res.ok) throw new BrokerstarError(res.status, await res.text());
    return (await res.json()) as T;
  } catch (error) {
    console.log(error);
    return fallback;
  }
}

/** POST/PUT con fallback silenzioso. */
async function bsSend<T>(
  method: "POST" | "PUT",
  path: string,
  body: unknown,
  fallback: T,
): Promise<T> {
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: authHeaders({ "Content-Type": "application/json", Accept: "application/json" }),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new BrokerstarError(res.status, await res.text());
    return (await res.json()) as T;
  } catch (error) {
    console.log(error);
    return fallback;
  }
}

/** POST che PROPAGA gli errori (login, register): body JSON parsato in BrokerstarError. */
async function bsSendOrThrow<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json", Accept: "application/json" }),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let parsed: unknown;
    try {
      parsed = await res.json();
    } catch {
      parsed = await res.text().catch(() => "");
    }
    throw new BrokerstarError(res.status, parsed);
  }
  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Authentication

/** POST /login — propaga gli errori (il form login li gestisce). */
export async function login(username: string, password: string): Promise<unknown> {
  return bsSendOrThrow("/login", { username, password });
}

/** Parità con l'originale: la "logout" chiama GET /contact e ignora gli errori. */
export async function logout(): Promise<unknown> {
  return bsGet("/contact", {});
}

/** POST /user/register — propaga gli errori (violation per-campo). */
export async function registerUser(registerData: Record<string, unknown>): Promise<unknown> {
  return bsSendOrThrow("/user/register", registerData);
}

export async function addSubcontact(registerData: Record<string, unknown>): Promise<unknown> {
  return bsSend("POST", "/contact", registerData, []);
}

export async function resetPassword(formData: Record<string, unknown>): Promise<unknown> {
  return bsSend("POST", "/user/reset-password", formData, []);
}

export async function confirmResetPassword(
  formData: Record<string, unknown>,
): Promise<unknown> {
  return bsSend("POST", "/user/confirm-reset-password", formData, []);
}

// ---------------------------------------------------------------------------
// Contact

export async function contactRelation(
  page: number = 1,
  limit: number = 100,
  contactLoginId?: string,
  contactId?: string,
): Promise<unknown> {
  const params = new URLSearchParams();
  if (page !== 1) params.set("page", String(page));
  if (limit !== 100) params.set("limit", String(limit));
  if (contactLoginId) params.set("contact_login_id", contactLoginId);
  if (contactId) params.set("contact_id", contactId);
  const qs = params.toString();
  return bsGet(`/contact/relation${qs ? `?${qs}` : ""}`, {});
}

export interface ContactPage {
  data: unknown[];
  page: number;
  pages: number;
  total: number;
}

export async function loadContactPage(
  page: number,
  requestParams: Record<string, string | number> = {},
): Promise<ContactPage> {
  const params = new URLSearchParams({ page: String(page) });
  for (const key of Object.keys(requestParams)) {
    params.set(key, String(requestParams[key]));
  }
  return bsGet<ContactPage>(`/contact?${params.toString()}`, {
    data: [],
    page,
    pages: 0,
    total: 0,
  });
}

/**
 * Carica pagina 1, poi tutte le altre in parallelo e concatena
 * (port di contactContactList: forkJoin → Promise.all).
 */
export async function contactContactList(
  requestParams: Record<string, string | number> = {},
): Promise<unknown> {
  try {
    const { page: _page, limit: _limit, ...otherParams } = requestParams;
    const firstPageData = await loadContactPage(1, otherParams);
    if (!firstPageData?.pages) {
      return firstPageData;
    }
    const totalPages = firstPageData.pages;
    const allContacts = firstPageData.data || [];
    if (totalPages <= 1) {
      return firstPageData;
    }
    const pagePromises: Promise<ContactPage>[] = [];
    for (let pageNum = 2; pageNum <= totalPages; pageNum++) {
      pagePromises.push(loadContactPage(pageNum, otherParams));
    }
    const allPagesData = await Promise.all(pagePromises);
    for (const pageData of allPagesData) {
      if (pageData?.data) {
        allContacts.push(...pageData.data);
      }
    }
    return {
      ...firstPageData,
      data: allContacts,
      page: 1,
      pages: totalPages,
      total: firstPageData.total,
    };
  } catch (error) {
    console.log(error);
    return [];
  }
}

export async function contact(contactid: number): Promise<unknown> {
  return bsGet(`/contact/${contactid}`, {});
}

export async function changeContact(contactid: string, payload: unknown): Promise<unknown> {
  return bsSend("PUT", `/contact/${contactid}`, payload, {});
}

export async function changeContactPassword(payload: unknown): Promise<unknown> {
  return bsSend("POST", "/user/change-password", payload, {});
}

/** GET avatar come Blob; {} su errore (parità). */
export async function contactGetAvatar(contactid: number): Promise<Blob | Record<string, never>> {
  try {
    const res = await fetch(`${API}/contact/avatar/${contactid}`, { headers: authHeaders() });
    if (!res.ok) throw new BrokerstarError(res.status, await res.text());
    return await res.blob();
  } catch {
    return {};
  }
}

export async function contactFiles(contactid: string): Promise<unknown> {
  return bsGet(`/document-category/item?module=1&add_contact_files=${contactid}`, []);
}

export async function getDocumentCategoryItemInfo(contactid: string): Promise<unknown> {
  return bsGet(
    `/document-category/item?document_category=1&module=1&add_contact_files=${contactid}`,
    {},
  );
}

// ---------------------------------------------------------------------------
// User

export async function userMe(): Promise<unknown> {
  return bsGet("/user/me", {});
}

export async function userMeUpdate(formData: Record<string, unknown>): Promise<unknown> {
  return bsSend("POST", "/user/me", formData, []);
}

// ---------------------------------------------------------------------------
// CustomerPortalMenu (cache-first in localStorage, parità con l'originale)

export async function customerportalmenu(level: number | string): Promise<unknown> {
  const cache = storage.getItem(`customerportalmenu${level}`);
  if (cache) {
    return JSON.parse(cache);
  }
  const data = await bsGet<unknown[]>(`/customerportalmenu/list/${level}`, []);
  if (Array.isArray(data) && data.length > 0) {
    storage.setItem(`customerportalmenu${level}`, JSON.stringify(data));
  }
  return data;
}

// ---------------------------------------------------------------------------
// Chat

/**
 * Unisce messaggi conversazione + messaggi di sistema
 * (port del forkJoin di chatConversationMessages).
 */
export async function chatConversationMessages(
  userid: number,
  limit?: number,
  page?: number,
  lastid?: number,
): Promise<{ data?: unknown[] } & Record<string, unknown>> {
  const suffix =
    "?sort=chat.id&order=desc" +
    (limit !== undefined && page !== undefined ? `&limit=${limit}&page=${page}` : "") +
    (isset(lastid) ? `&filters[last_id]=${lastid}` : "");

  const [chatMessages, systemMessages] = await Promise.all([
    bsGet<{ data?: unknown[] }>(`/chat/messages/${userid}${suffix}`, {}),
    bsGet<{ data?: unknown[] }>(`/chat/messages${suffix}`, {}),
  ]);
  if (isset(chatMessages.data) && isset(systemMessages.data)) {
    chatMessages.data = (chatMessages.data as unknown[]).concat(
      systemMessages.data as unknown[],
    );
  }
  return chatMessages;
}

export async function chatFloodedChat(): Promise<unknown> {
  return bsGet("/chat/flooded", []);
}

export async function chatPostMessage(message: string, userid: number): Promise<unknown> {
  if (message.length === 0) {
    return {};
  }
  return bsSend("POST", "/chat", { message, user: String(userid) }, []);
}

export async function chatMuteConversation(userid: number): Promise<unknown> {
  return bsGet(`/chat/mute/${userid}`, []);
}

// ---------------------------------------------------------------------------
// Claim

export async function claimInformInsurances(claimid: number): Promise<unknown> {
  return bsSend("POST", `/claim/inform-insurances/${claimid}`, { _sendMail: true }, []);
}

export async function createClaim(
  policyid: number,
  datetime: string,
  info: string,
): Promise<unknown> {
  return bsSend("POST", `/claim/${policyid}`, { dateTime: datetime, info }, undefined);
}

// ---------------------------------------------------------------------------
// Mandate

export async function mandateInformInsurances(
  newMandate: boolean = false,
  insurances: Record<string, boolean> = {},
  contactLoginId: number | null = 0,
): Promise<unknown> {
  return bsSend(
    "POST",
    "/mandate/inform-insurances",
    // NB: il campo si chiama `isNew` (fix doc 2026-05-21-22-12)
    { isNew: newMandate, _sendMail: true, insurances, contact_login_id: contactLoginId },
    [],
  );
}

// ---------------------------------------------------------------------------
// Quotation (cache-first in localStorage, parità con l'originale)

export async function quotation(): Promise<unknown> {
  const cached = storage.getItem("quotations");
  if (cached) {
    return JSON.parse(cached);
  }
  const data = await bsGet<unknown>("/quotation", {});
  if (isset(data, true)) {
    storage.setItem("quotations", JSON.stringify(data));
  }
  return data;
}

// ---------------------------------------------------------------------------
// Policy

export async function policyList(
  requestParams: Record<string, string | number> = {},
): Promise<unknown> {
  const params = new URLSearchParams();
  for (const key of Object.keys(requestParams)) {
    params.set(key, String(requestParams[key]));
  }
  const qs = params.toString();
  return bsGet(`/policy${qs ? `?${qs}` : ""}`, []);
}

export async function policy(policyid: string): Promise<unknown> {
  return bsGet(`/policy/${policyid}?show_policy_document=true`, []);
}

/** Restituisce la premium invoice con endDate più recente (o {}). */
export async function premiumInvoice(policyid: string): Promise<unknown> {
  const data = await bsGet<{ data?: { endDate: string }[] }>(
    `/premium-invoice?policies=${policyid}&invoice_statuses=3,4`,
    {},
  );
  if (data.data && data.data.length > 0) {
    data.data.sort(
      (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
    );
    return data.data[0];
  }
  return {};
}

// ---------------------------------------------------------------------------
// Insurance

export async function insurance(): Promise<unknown> {
  return bsGet("/contact/insurance", []);
}

// ---------------------------------------------------------------------------
// Tender / Offer

export async function tender(): Promise<unknown> {
  return bsGet("/tender", []);
}

export async function tenderOffer(tenderid: string): Promise<unknown> {
  return bsGet(`/tender/offer?tender=${tenderid}`, []);
}

export async function tenderOfferAccept(offerid: string): Promise<unknown> {
  return bsSend("POST", `/tender/offer/${offerid}/accept`, {}, []);
}

export async function tenderOfferReject(offerid: string): Promise<unknown> {
  return bsSend("POST", `/tender/offer/${offerid}/reject`, {}, []);
}

// ---------------------------------------------------------------------------
// File / Jasper

export async function fileInfo(fileid: string): Promise<unknown> {
  return bsGet(`/file/${fileid}`, undefined);
}

/** GET file come Blob; undefined su errore (parità — il FileComponent la usa). */
export async function file(fileid: string): Promise<Blob | undefined> {
  try {
    const res = await fetch(`${API}/file/${fileid}/download`, { headers: authHeaders() });
    if (!res.ok) throw new BrokerstarError(res.status, await res.text());
    return await res.blob();
  } catch (error) {
    console.log(error);
    return undefined;
  }
}

export async function createJasperreport(
  reportName: string,
  contactid: number | string,
): Promise<unknown> {
  return bsSend(
    "POST",
    "/jasperreport/create",
    {
      reportName,
      contact: parseInt(String(contactid), 10),
      returnBase64: true,
      fileParameters: { publicAccess: true, documentCategoryItem: 1 },
    },
    [],
  );
}

export async function createSignetJasperreport(
  reportName: string,
  contactid: number | string,
  image: string,
): Promise<unknown> {
  return bsSend(
    "POST",
    "/jasperreport/create",
    {
      reportName,
      contact: parseInt(String(contactid), 10),
      imageBase64: image,
      saveFile: true,
      fileParameters: { publicAccess: true, documentCategoryItem: 1 },
    },
    [],
  );
}

// ---------------------------------------------------------------------------
// Upload (propagano gli errori, parità con gli async originali)

export async function uploadFile(files: File[], claimid: string = ""): Promise<unknown> {
  const formData = new FormData();
  for (const f of files) {
    formData.append("file[]", f, f.name);
  }
  const res = await fetch(`${API}/file?module=claim&entity_id=${claimid}`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const error = new BrokerstarError(res.status, await res.text());
    console.error("Error uploading file:", error);
    throw error;
  }
  return res.json();
}

export async function uploadProfileFile(
  options: { currentUploadEntryid: string | number; profileid: string | number; currentLanguage: string },
  fileToUpload: File,
): Promise<unknown> {
  const formData = new FormData();
  formData.append("file", fileToUpload, fileToUpload.name);
  const res = await fetch(
    `${API}/document-category/item/upload/${options.currentUploadEntryid}/${options.profileid}/${options.currentLanguage}`,
    { method: "POST", headers: authHeaders(), body: formData },
  );
  if (!res.ok) {
    const error = new BrokerstarError(res.status, await res.text());
    console.error("Error uploading profile file:", error);
    throw error;
  }
  return res.json();
}
