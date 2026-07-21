/**
 * Configurazione divisa: publicConfig è utilizzabile ovunque,
 * serverConfig SOLO in codice server (route handler) — contiene i segreti.
 */

export const publicConfig = {
  brokerstarApiUrl:
    process.env.NEXT_PUBLIC_BROKERSTAR_API_URL ?? "https://onezone.brokerstar.biz/api/v3",
  automationScrapers: (
    process.env.NEXT_PUBLIC_AUTOMATION_SCRAPERS ??
    "axa,Allianz,Helvetia,Generali,Simpego,Zurich,Vaudoise,Automate,Mobiliar"
  ).split(","),
};

export function getServerConfig() {
  if (typeof window !== "undefined") {
    throw new Error("serverConfig must never be imported client-side");
  }
  return {
    automationApiUrl: process.env.AUTOMATION_API_URL ?? "",
    automationAdminApiKey: process.env.AUTOMATION_ADMIN_API_KEY ?? "",
    swissCarInfoApiUrl: process.env.SWISSCARINFO_API_URL ?? "",
    swissCarInfoApiKey: process.env.SWISSCARINFO_API_KEY ?? "",
  };
}
