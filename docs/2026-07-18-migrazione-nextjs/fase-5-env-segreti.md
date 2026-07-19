# Fase 5 — Env e Segreti

← [Torna al documento di progetto](00-progetto.md)

**Stato**: ☑ Completata (2026-07-19) — rotazione chiavi da fare al cutover
**Dipende da**: [Fase 1](fase-1-infrastruttura.md) (i proxy nascono già leggendo queste variabili; questa fase è il consolidamento e la documentazione)

## Obiettivo

Separare configurazione pubblica e segreta. Oggi nel repo Angular **tutte le chiavi sono committate nel client** (`environment.ts`): admin key automazione e chiave SwissCarInfo sono in git history e in ogni bundle spedito. Nella nuova app i segreti vivono solo in env server-side.

## Variabili

| Variabile | Scope | Valore / Note |
|---|---|---|
| `NEXT_PUBLIC_BROKERSTAR_API_URL` | pubblica | `https://onezone.brokerstar.biz/api/v3` — chiamata direttamente dal browser col Bearer utente (come oggi, nessun segreto) |
| `AUTOMATION_API_URL` | server-only | `https://api-car-scraping.onezone.ch` |
| `AUTOMATION_ADMIN_API_KEY` | server-only | ⚠️ oggi `valeman`, committata nel repo Angular — **DA RUOTARE** |
| `SWISSCARINFO_API_URL` | server-only | `https://api.swisscarinfo.ch/v3` |
| `SWISSCARINFO_API_KEY` | server-only | ⚠️ committata in git history (`sci_5cb8…`) — **DA RUOTARE** |
| `SWISSCARINFO_BRANDS_URL` | server-only | `https://swisscarinfo.ch/assets/api/brands.php` |
| `NEXT_PUBLIC_AUTOMATION_SCRAPERS` | pubblica | `axa,Allianz,Helvetia,Generali,Simpego,Zurich,Vaudoise,Automate,Mobiliar` |

Note:
- L'`api_key` per-consulente NON è un segreto di repo: è restituita dall'API al singolo consulente e resta in localStorage come oggi.
- openplzapi.org è pubblica, nessuna chiave.

## File

- `.env.local` — valori reali, **mai committato** (in `.gitignore`).
- `.env.example` — committato, stessi nomi con placeholder.
- `src/lib/config.ts` — modulo che esporta due oggetti: `publicConfig` (solo `NEXT_PUBLIC_*`) e `serverConfig` (con guard che lancia se importato client-side, es. check `typeof window`).

## Piano rotazione chiavi (post-migrazione, azione utente)

1. A cutover completato, richiedere/rigenerare: nuova admin key per api-car-scraping, nuova chiave SwissCarInfo.
2. Aggiornare `.env.local` sul server → riavvio `next start`.
3. Verificare che il vecchio repo Angular sia dismesso prima della rotazione (le vecchie chiavi smettono di funzionare nei bundle Angular ancora serviti).

## Criteri di verifica

- [x] `grep -r` delle chiavi su `.next/static` → 0 match (verificato più volte)
- [x] App funzionante con `.env.local` (valori attuali dell'app Angular)
- [x] `getServerConfig()` lancia se chiamato client-side (guard `typeof window`)
- [x] `.env.local` coperto da `.env*` in `.gitignore`, con eccezione `!.env.example`

## Esito

Completata il 2026-07-19 (implementata di fatto in fase 1 con i proxy; qui consolidata). ⚠️ RESTA DA FARE AL CUTOVER: rotazione di `AUTOMATION_ADMIN_API_KEY` e `SWISSCARINFO_API_KEY` (sono nella git history del repo Angular e nei bundle Angular ancora serviti).
