# Fase 1 — Infrastruttura Core

← [Torna al documento di progetto](00-progetto.md)

**Stato**: ☑ Completata (2026-07-18) — login reale da provare con account di test
**Dipende da**: [Fase 0](fase-0-scaffold-design-system.md)

## Obiettivo

Portare i servizi Angular in moduli Next.js: storage, i18n, auth, client API BrokerStar, proxy server-side per le API con segreti, data layer TanStack Query, toaster e loader. A fine fase l'app sa autenticarsi e parlare con tutti i backend, senza ancora nessuna pagina reale.

## 1. Mappa servizio Angular → modulo Next

| Servizio Angular | Modulo Next | Note |
|---|---|---|
| `storage.service.ts` | `src/lib/storage.ts` | Wrapper localStorage SSR-safe (`typeof window` guard); port di `setItem/getItem/removeItem/clear` + `clearOldVersions` (chiave `version` vs versione app) |
| `helper.ts` | `src/lib/helper.ts` | Port `isset`, `trim`, `clone`, `convertStringToJSON` (usati ovunque) |
| `i18n.service.ts` + `i18nfile.service.ts` | `src/lib/i18n/I18nProvider.tsx` + `useT()` | Vedi §2 |
| `auth.service.ts` | `src/lib/auth/AuthProvider.tsx` + `roles.ts` | Vedi §3 |
| `brokerstar.service.ts` | `src/lib/api/brokerstar.ts` | Vedi §4 |
| `automation.service.ts` | `src/lib/api/automation.ts` + proxy `/api/automation/*` + `/api/localities` | Vedi §5 |
| `swiss-car-info.service.ts` | `src/lib/api/swisscarinfo.ts` + proxy `/api/swisscarinfo/*` | Vedi §5 |
| `onezone.service.ts` | `src/lib/api/onezone.ts` | Banner WordPress `onezone.ch/wp-json/wp/v2/banner`, cache via Query persister (sostituisce `bannerData`) |
| `toaster.service.ts` | `src/lib/toaster.ts` | Wrapper sonner con stessa API (success/error/info con titoli i18n); `<Toaster/>` nel root layout stilizzato sul design system |
| `loader.service.ts` | `src/lib/loader/LoaderProvider.tsx` | Context overlay globale, renderizzato nei layout authed/pdf |
| `navigator.service.ts` | `src/lib/navigation.ts` | In fase 2 (dipende dai layout) |

## 2. i18n (`src/lib/i18n/`)

- **File lingua**: copiati verbatim da `src/assets/i18n/{de,en,fr,it}.json` in `src/lib/i18n/messages/` e **importati staticamente** (~32KB l'uno, chiavi tipizzabili, nessun fetch waterfall).
- **Risoluzione lingua** (port esatto da `i18n.service.ts`):
  1. localStorage `selectedLanguage` — **incluso mapping valori legacy** (`english`→en, `french`→fr, `italian`→it, `german`→de e codici corti)
  2. fallback lingua browser
  3. default `de`
- **`useT()`**: replica `getTranslation(...groups)` — chiave puntata split, fallback `'MISSINGTRANSLATION'`.
- **`langToNumeric()`**: de=1, fr=2, it=3, en=4 (usato nei payload BrokerStar).
- **Cambio lingua**: `setLang()` scrive localStorage + aggiorna context → re-render React (niente `window.location.reload()`, che era un workaround Angular).

## 3. Auth (`src/lib/auth/`)

- **`AuthProvider.tsx`** — port di `auth.service.ts`:
  - Stato: `token`, `userData`, `tokenValidUntil`, `isAuth`, `isConsultant`
  - `startSession(token)`: salva token, `tokenValidUntil = now + 24h` (UTC string in localStorage), poi `userMe()` → `userData`
  - `loadSession()`: rilegge da localStorage al mount, valida scadenza
  - `isLogged()`: `isAuth && userData.contact && token && tokenValidUntil > new Date()`
  - `endSession()`/`logout()`: chiama `brokerstar.logout()`, poi svuota storage (parità: `storage.clear()` totale) e redirect `/login`
  - `getUserName(type, name1, name2)`: stessa logica di ordinamento nome persona/azienda
- **`roles.ts`**: `ADMIN_CONTACT_IDS = [58, 25755]`, helper `isAdmin(userData)`, `isConsultant(userData)`, ruolo partner Wefox.
- **`AuthGuard.tsx` / `GuestGuard.tsx`**: client component che wrappano i layout dei route group. Rendering `null`/loader finché `loadSession()` non risolve, poi redirect (`/login` ↔ `/home`) con semantica identica a `group.guard.ts`.
- Chiavi localStorage da preservare (nomi identici): `token`, `tokenValidUntil`, `userData`, `selectedLanguage`, `version`, `consultantApiKey`.

## 4. Client BrokerStar (`src/lib/api/brokerstar.ts`)

Client fetch-based, una funzione `async` tipizzata per endpoint. Header `Authorization: Bearer {token}` preso dal contesto auth (parametro o getter modulo). **Semantica errori da preservare**: fallback silenzioso `[]`/`null` come `catchError(() => of([]))` — le pagine dipendono da questo; eccezioni: `login`, `registerUser`, `resetPassword` che espongono le violation per-campo.

Funzioni da portare (inventario completo da `brokerstar.service.ts`, ~45):

| Area | Funzioni |
|---|---|
| Auth | `login` (FormData, incl. 2FA), `logout`, `registerUser`, `addSubcontact`, `resetPassword`, `confirmResetPassword` |
| Contatti | `contactRelation`, `contactContactList`, `loadContactPage` (paginazione), `contact`, `changeContact`, `changeContactPassword`, `contactGetAvatar`, `contactFiles`, `getDocumentCategoryItemInfo` |
| Utente | `userMe`, `userMeUpdate` |
| Menu | `customerportalmenu(level)` — cache localStorage `customerportalmenu{level}` |
| Chat | `chatConversationMessages`, `chatFloodedChat`, `chatPostMessage`, `chatMuteConversation` |
| Sinistri | `createClaim`, `claimInformInsurances` |
| Mandati | `mandateInformInsurances` (attenzione campo `isNew`, doc `2026-05-21-22-12`) |
| Polizze | `policyList` (paginazione `forkJoin` → loop `Promise.all`), `policy`, `premiumInvoice`, `quotation` (cache `quotations`) |
| Offerte | `tender`, `tenderOffer`, `tenderOfferAccept`, `tenderOfferReject` |
| File/report | `fileInfo`, `file` (base64), `createJasperreport`, `createSignetJasperreport`, `uploadFile`, `uploadProfileFile` |
| Altro | `insurance` |

Conversione meccanica un endpoint alla volta; `distinctUntilChanged` degli Observable non serve più (fetch one-shot); i `tap` che scrivevano cache localStorage diventano responsabilità del Query persister (§6).

## 5. Proxy server-side (segreti solo in env)

### `src/app/api/automation/[...path]/route.ts`
- Inoltra GET/POST/PATCH a `AUTOMATION_API_URL` (`https://api-car-scraping.onezone.ch`).
- **Allowlist security-critical** dei path che ricevono l'iniezione di `AUTOMATION_ADMIN_API_KEY`: lista consulenti, register consulente, verify-login, extract-totp-secret (multipart), credentials, lookup consulente pubblico. Tutto il resto NON riceve la chiave admin.
- Chiamate consultant-scoped: inoltrano l'`api_key` del consulente inviata dal client (chiave per-consulente restituita dall'API, non è un segreto di repo — resta in localStorage come oggi).
- Flusso pubblico `generate-quotes` (rotta `automation-form-generic-client`): la chiave del consulente pubblico è risolta server-side, mai esposta al client.
- Polling asincrono: `request_id` → status tracking (doc `2026-03-09-18-03`) passa dallo stesso proxy.

### `src/app/api/swisscarinfo/route.ts` (+ `/brands`)
- Proxy verso `SWISSCARINFO_API_URL` (`api.swisscarinfo.ch/v3`) e brands endpoint, con `SWISSCARINFO_API_KEY` iniettata server-side.
- Azioni: ricerca veicoli (type_approval, matricule, filtri modello/potenza `action=filters`/`action=vehicles`), lista brand.

### `src/app/api/localities/route.ts`
- Lookup PLZ svizzeri su `src/data/AMTOVZ_CSV_LV95.csv` (491KB, server-only, MAI in `public/`).
- Parse una volta a livello modulo (cache in memoria del processo Node).
- Query: `?plz=` esatto e ricerca prefisso, mirroring `getLocalitiesByPlz`/`searchByPlz` di `automation.service.ts`.
- La ricerca vie via `openplzapi.org` resta client-side (API pubblica, nessun segreto) — port di `searchStreets` incluso il regex guard sul nome.

### Client verso i propri proxy
- `src/lib/api/automation.ts` e `src/lib/api/swisscarinfo.ts`: chiamano **solo** `/api/automation/*` e `/api/swisscarinfo/*`, mai gli upstream.

## 6. Data layer TanStack Query

- `QueryClientProvider` nel root layout + `persistQueryClient` con persister localStorage.
- Hook per feature (colocati o `src/lib/api/queries.ts`): `usePolicies`, `useMenu(level)`, `useQuotations`, `useCustomersMandate`, `useConsultantData`, `useBanner`, `useConsultantLoginCheck`…
- Le cache hand-rolled attuali diventano entry del persister con **stessa UX** (paint immediato da cache + refresh in background): `customerportalmenu{level}`, `quotations`, `customers-mandate-cache` (SWR con `Map<page, records>` — doc `2026-07-06`), `consultantData`, `bannerData`, `consultantLoginCheck`.
- Semantica SWR: `staleTime: 0` + `placeholderData` dalla cache persistita.
- Mutations per accept/reject offerte, submit form, upload.
- Nota: `endSession` → `storage.clear()` svuota anche il persister. Voluto (parità logout).

## Criteri di verifica

- [~] Pagina di test `/infra-test` pronta; login reale DA PROVARE con un account di test (Dario)
- [x] Cambio lingua a runtime aggiorna le label senza reload (verificato in browser IT→DE)
- [x] `GET /api/localities?plz=6900` → 4 località corrette (Lugano, Massagno, Paradiso×2); prefisso `69` → 118
- [x] Proxy automation: path fuori allowlist → 403; `consultants/sys:public_web` → 403; `generate-quotes` senza chiave → 401. Verify-login su consulente reale: da provare in fase 3 (automation-setup)
- [x] Proxy SwissCarInfo: `?q=golf` → success con risultati reali
- [x] Nessuna chiave segreta nel bundle client (grep su `.next/static` → 0 match)
- [x] `npm run build` verde (include TS)

## Esito

Completata il 2026-07-18. Note di implementazione:
- `login` posta JSON (non FormData): parità con HttpClient Angular che serializza l'oggetto in JSON.
- `logout` chiama `GET /contact` (comportamento curioso ma fedele all'originale).
- Le cache `customerportalmenu{level}` e `quotations` restano cache-first in localStorage dentro `brokerstar.ts` (parità); il persister TanStack Query (`onezone-query-cache`) copre le altre. Gli hook Query per-feature verranno creati in fase 3 accanto alle pagine.
- `brands.php` (SwissCarInfo) non richiede chiave → resta chiamato direttamente dal client; solo `/v3/search` passa dal proxy.
- Flusso pubblico: `POST /api/automation/public/generate-quotes` e `GET public/quote-requests/{id}` — la api_key `sys:public_web` è risolta e cachata solo nel processo server.
- File creati: `src/lib/{helper,storage,config,toaster}.ts(x)`, `src/lib/i18n/I18nProvider.tsx` (+4 JSON), `src/lib/auth/{AuthProvider,guards,roles}`, `src/lib/loader/LoaderProvider.tsx`, `src/lib/query/QueryProvider.tsx`, `src/lib/api/{brokerstar,automation,automation.types,swisscarinfo,onezone}.ts`, proxy `/api/automation/[...path]`, `/api/swisscarinfo/search`, `/api/localities`, `src/app/providers.tsx`, pagina dev `/infra-test`.
