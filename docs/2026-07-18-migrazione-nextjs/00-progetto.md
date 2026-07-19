# Progetto: Migrazione OneZone Web — Angular 20 → Next.js 16 (con redesign)

**Data creazione**: 2026-07-18 20:06
**Repo destinazione**: `/Users/dario/Documents/ONEZONE_APP/onezoneweb_redesign`
**Repo sorgente (riferimento)**: `/Users/dario/Documents/ONEZONE_APP/onezoneweb_20251219`

---

## Contesto

OneZone Web è una SPA Angular 20 (standalone components) che funge da portale clienti per la gestione di polizze assicurative sul mercato svizzero. Backend: **BrokerStar** (`https://onezone.brokerstar.biz/api/v3`), autenticazione Bearer JWT con validità 24h in localStorage. Dimensioni: ~25 pagine / 30 rotte, 11 servizi singleton, ~15.500 righe TS+HTML. Stack attuale: Tailwind 3, ngx-toastr, i18n custom a 4 lingue (de default, fr, it, en).

## Obiettivi

1. **Ricostruire l'intera app in Next.js 16 (App Router)** in questa repo, partendo da zero.
2. **Nuova veste grafica** basata sul design system esistente:
   `/Users/dario/Documents/Claude/dashboard-car-automation/docs/OneZone Design System.html`
   (DM Sans, accento unico `#254083`, bianco dominante, radii 10–24, icone stile Lucide stroke 1.6, mobile-first).
3. **Deploy su server Node** → le API key oggi committate nel client (admin key automazione, chiave SwissCarInfo) passano server-side dietro route handler proxy.
4. **Parità funzionale completa**: stessi path URL (contratto con email/QR), stessi 4 ruoli (cliente, consulente, admin, partner Wefox), stesse 4 lingue, stesse integrazioni esterne.

## Decisioni architetturali

| Tema | Scelta | Motivo |
|---|---|---|
| Framework | Next.js 16 App Router + TypeScript strict | Route group ↔ 3 layout Angular; route handler per i segreti |
| Tailwind | v4 (token CSS-first `@theme`) | Greenfield; il design system è una lista piatta di token |
| Rendering | Pagine tutte client component (`page.tsx` server sottile → feature component `"use client"`) | App 100% dinamica/autenticata contro API esterna |
| Auth | JWT in localStorage + guard client-side, parità con `group.guard.ts` | Backend esterno; cookie httpOnly richiederebbe proxy di ogni chiamata BrokerStar |
| Data fetching | TanStack Query v5 + `persistQueryClient` (localStorage) | Replica i pattern SWR/cache esistenti |
| Form | react-hook-form + zod (form grandi); useState (login) | |
| i18n | Context React custom, riuso verbatim dei 4 JSON, niente prefissi URL | next-intl è routing-oriented, non combacia col modello attuale |
| Toast | sonner stilizzato sul design system | |
| Icone | lucide-react `strokeWidth={1.6}` | Il design system è esplicitamente in stile Lucide |
| CSV località CH (491KB) | Route handler `/api/localities` server-side | Non spedire 491KB al client |

## Spec di riferimento (repo sorgente)

- `docs/2026-05-22-15-17-struttura-app-per-redesign.md` — inventario UI funzionale per pagina (la spec di cosa deve contenere ogni schermata)
- `APP_FUNCTIONAL_SPEC_WEB_IT.md` — vincoli vincolanti: 4 ruoli, 4 lingue, integrazioni, 3 layout
- `openapi.json`, `FRONTEND_FORM_CONTRACT (1).md` — contratti API
- `wiki/*.md` — dettaglio tecnico dell'app attuale
- `docs/2026-*` — comportamenti feature-specifici (autocomplete, cache, validator…)

## Fasi del progetto

| # | Fase | Documento di dettaglio | Stato |
|---|------|------------------------|-------|
| 0 | Scaffold + design token + UI kit | [fase-0-scaffold-design-system.md](fase-0-scaffold-design-system.md) | ☑ |
| 1 | Infrastruttura core (i18n, auth, API, proxy) | [fase-1-infrastruttura.md](fase-1-infrastruttura.md) | ☑ |
| 2 | Layout + scheletro rotte | [fase-2-layout-rotte.md](fase-2-layout-rotte.md) | ☑ |
| 3 | Migrazione pagine (7 gruppi) | [fase-3-pagine.md](fase-3-pagine.md) | ☑ |
| 4 | Asset | [fase-4-asset.md](fase-4-asset.md) | ☑ |
| 5 | Env e segreti | [fase-5-env-segreti.md](fase-5-env-segreti.md) | ☑ |
| 6 | Verifica finale e cutover | [fase-6-verifica.md](fase-6-verifica.md) | ◐ |

Ogni file di fase contiene il dettaglio esecutivo completo e i criteri di verifica; a fine fase viene aggiornato con l'esito e lo stato qui sopra passa a ☑.

## Rischi principali

1. **automation-form** (1915 righe TS + 1678 HTML): ~30–40% dell'effort totale. Mitigazione: schema-first (zod), decomposizione in step, `AddressAutocomplete` condiviso costruito prima (gruppo mandati).
2. **Conversione RxJS→promise di BrokerstarService**: preservare i fallback silenziosi (`catchError → of([])`), la paginazione `forkJoin`, i side-effect di cache.
3. **Cambio lingua runtime**: in React il context re-renderizza — nessun componente deve congelare stringhe tradotte nello state.
4. **Rotta pubblica automation**: senza guard, ma il lookup "consulente pubblico" con admin key deve stare interamente server-side — l'allowlist del proxy è security-critical.
5. **Parità path URL**: non rinominare nulla (email e QR code puntano agli URL attuali).
6. **Semantica `back()`/`inMenu`** del NavigatorService con il router Next.
7. **Rotazione chiavi**: le due chiavi committate nel repo Angular vanno ruotate a fine migrazione (vedi fase 5).
