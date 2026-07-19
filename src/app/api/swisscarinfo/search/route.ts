/**
 * Proxy verso SwissCarInfo /v3/search — inietta X-API-Key server-side.
 * (brands.php non richiede chiave e resta chiamato direttamente dal client.)
 */

import { type NextRequest } from "next/server";
import { getServerConfig } from "@/lib/config";

export async function GET(req: NextRequest): Promise<Response> {
  const cfg = getServerConfig();
  try {
    const res = await fetch(`${cfg.swissCarInfoApiUrl}/search${req.nextUrl.search}`, {
      headers: { "X-API-Key": cfg.swissCarInfoApiKey, Accept: "application/json" },
    });
    return new Response(res.body, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error("SwissCarInfo proxy error:", error);
    return Response.json({ success: false, data: [] }, { status: 502 });
  }
}
