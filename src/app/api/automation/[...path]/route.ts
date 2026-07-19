/**
 * Proxy verso l'API car-scraping (AUTOMATION_API_URL).
 * La admin key vive SOLO qui (env server): il client non la vede mai.
 *
 * Sicurezza — allowlist esplicita method+path:
 * - auth "admin": path che nell'app Angular usavano la admin key
 *   (setup/lookup consulenti, verify-login, TOTP, credenziali);
 * - auth "consultant": il client manda la PROPRIA api_key consulente
 *   nell'header `x-consultant-api-key` (non è un segreto di repo);
 * - flusso pubblico: path speciali `public/...` — la api_key del consulente
 *   pubblico (sys:public_web) è risolta e usata solo server-side.
 * Tutto ciò che non matcha viene rifiutato: il proxy non è un relay aperto.
 */

import { type NextRequest } from "next/server";
import { getServerConfig } from "@/lib/config";

const PUBLIC_CONSULTANT_ID = "sys:public_web";

interface Rule {
  method: string;
  pattern: RegExp;
  auth: "admin" | "consultant";
}

const RULES: Rule[] = [
  { method: "POST", pattern: /^consultants$/, auth: "admin" },
  { method: "GET", pattern: /^consultants$/, auth: "admin" },
  { method: "GET", pattern: /^consultants\/[^/]+$/, auth: "admin" },
  { method: "PATCH", pattern: /^consultants\/[^/]+$/, auth: "admin" },
  { method: "POST", pattern: /^consultants\/[^/]+\/verify-login$/, auth: "admin" },
  { method: "POST", pattern: /^consultants\/[^/]+\/credentials$/, auth: "admin" },
  { method: "POST", pattern: /^extract-totp-secret$/, auth: "admin" },
  { method: "POST", pattern: /^generate-quotes$/, auth: "consultant" },
  { method: "GET", pattern: /^quote-requests\/\d+$/, auth: "consultant" },
];

/** Cache di processo della api_key del consulente pubblico. */
let publicApiKey: string | null = null;

async function resolvePublicApiKey(): Promise<string> {
  if (publicApiKey) return publicApiKey;
  const cfg = getServerConfig();
  const res = await fetch(`${cfg.automationApiUrl}/consultants/${PUBLIC_CONSULTANT_ID}`, {
    headers: {
      Authorization: `Bearer ${cfg.automationAdminApiKey}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Cannot resolve public consultant (${res.status})`);
  }
  const data = (await res.json()) as { api_key: string };
  publicApiKey = data.api_key;
  return publicApiKey;
}

async function forward(
  req: NextRequest,
  upstreamPath: string,
  bearer: string,
): Promise<Response> {
  const cfg = getServerConfig();
  const search = req.nextUrl.search;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${bearer}`,
    Accept: "application/json",
  };
  // Content-Type inoltrato così com'è (JSON o multipart per extract-totp-secret)
  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;

  const res = await fetch(`${cfg.automationApiUrl}/${upstreamPath}${search}`, {
    method: req.method,
    headers,
    body: req.method === "GET" ? undefined : await req.arrayBuffer(),
  });
  return new Response(res.body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/json",
    },
  });
}

async function handle(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await ctx.params;
  const joined = path.join("/");
  const cfg = getServerConfig();

  try {
    // --- Flusso pubblico (rotta automation-form-generic-client, senza login) ---
    if (joined === "public/generate-quotes" && req.method === "POST") {
      const key = await resolvePublicApiKey();
      return forward(req, "generate-quotes", key);
    }
    if (/^public\/quote-requests\/\d+$/.test(joined) && req.method === "GET") {
      // parità con l'originale: lo status in modalità pubblica usava la admin key
      return forward(req, joined.replace(/^public\//, ""), cfg.automationAdminApiKey);
    }

    // --- Allowlist ---
    const rule = RULES.find((r) => r.method === req.method && r.pattern.test(joined));
    if (!rule) {
      return Response.json({ error: "Not allowed" }, { status: 403 });
    }

    // La api_key del consulente pubblico non deve uscire dal server
    if (joined === `consultants/${PUBLIC_CONSULTANT_ID}`) {
      return Response.json({ error: "Not allowed" }, { status: 403 });
    }

    if (rule.auth === "admin") {
      return forward(req, joined, cfg.automationAdminApiKey);
    }

    // auth consulente: chiave propria del consulente, inviata dal client
    const consultantKey = req.headers.get("x-consultant-api-key");
    if (!consultantKey) {
      return Response.json({ error: "Missing consultant api key" }, { status: 401 });
    }
    return forward(req, joined, consultantKey);
  } catch (error) {
    console.error("Automation proxy error:", error);
    return Response.json({ error: "Proxy error" }, { status: 502 });
  }
}

export { handle as GET, handle as POST, handle as PATCH };
