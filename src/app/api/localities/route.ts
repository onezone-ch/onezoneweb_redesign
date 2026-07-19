/**
 * Lookup località svizzere per CAP dal CSV federale AMTOVZ (491KB) —
 * parsato una volta per processo, mai spedito al client.
 * Port di getLocalitiesByPlz / searchByPlz di automation.service.ts.
 *
 * GET /api/localities?plz=6900        → match esatto
 * GET /api/localities?plz=69&prefix=1 → ricerca per prefisso
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { type NextRequest } from "next/server";

export interface LocalityEntry {
  locality: string;
  plz: string;
  canton: string;
}

let localities: LocalityEntry[] | null = null;

async function loadLocalities(): Promise<LocalityEntry[]> {
  if (localities) return localities;
  const csvPath = path.join(process.cwd(), "src", "data", "AMTOVZ_CSV_LV95.csv");
  const csv = await readFile(csvPath, "utf-8");
  const lines = csv.split("\n");
  const parsed: LocalityEntry[] = [];
  // riga 0 = header (parità col parser Angular)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(";");
    parsed.push({ locality: cols[0], plz: cols[1], canton: cols[6] });
  }
  localities = parsed;
  return parsed;
}

export async function GET(req: NextRequest): Promise<Response> {
  const plz = req.nextUrl.searchParams.get("plz") ?? "";
  const prefix = req.nextUrl.searchParams.get("prefix") === "1";
  if (!plz) {
    return Response.json([]);
  }
  try {
    const all = await loadLocalities();
    const results = prefix
      ? all.filter((l) => l.plz.startsWith(plz))
      : all.filter((l) => l.plz === plz);
    return Response.json(results);
  } catch (error) {
    console.error("Localities lookup error:", error);
    return Response.json([], { status: 500 });
  }
}
