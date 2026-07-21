# API e Backend (client + proxy server-side)

## Client BrokerStar — [src/lib/api/brokerstar.ts](../src/lib/api/brokerstar.ts)

Client fetch verso `https://onezone.brokerstar.biz/api/v3` (Bearer JWT utente, chiamato direttamente dal browser). ~45 funzioni: auth (`login`, `logout`, `registerUser`, `addSubcontact`, `resetPassword`, `confirmResetPassword`), contatti (`contactContactList` con paginazione parallela, `loadContactPage`, `contact`, `changeContact*`, `contactGetAvatar`, `contactFiles`), utente (`userMe`, `userMeUpdate`), menu (`customerportalmenu` cache-first), chat, sinistri (`createClaim`, `claimInformInsurances`), mandati (`mandateInformInsurances` — campo `isNew`!), polizze (`policyList`, `policy`, `premiumInvoice`, `quotation` cache-first), offerte (`tender*`), file/jasper (`fileInfo`, `file` blob, `createJasperreport`, `createSignetJasperreport`, `uploadFile`, `uploadProfileFile`).

**Semantica errori (CRITICA, non cambiarla)**: quasi tutte le funzioni NON lanciano — su errore loggano e restituiscono il fallback (`[]`/`{}`/`undefined`) come il `catchError(() => of(...))` dell'app Angular; le pagine dipendono da questo. Eccezioni che lanciano `BrokerstarError` (status + body con violations): `login`, `registerUser`, upload.

Il token è stato di modulo: `setBrokerstarToken()` chiamato da AuthProvider.

## Proxy automazione — [src/app/api/automation/[...path]/route.ts](../src/app/api/automation/[...path]/route.ts)

Proxy verso l'API car-scraping. **La admin key vive SOLO qui** (env server). Allowlist method+path security-critical:
- auth `admin` (chiave iniettata): `POST|GET consultants`, `GET|PATCH consultants/{id}`, `verify-login`, `credentials`, `extract-totp-secret` (multipart)
- auth `consultant`: `POST generate-quotes`, `GET quote-requests/{id}` — il client manda la propria api_key nell'header `x-consultant-api-key`
- flusso pubblico: `POST public/generate-quotes` e `GET public/quote-requests/{id}` — la api_key di `sys:public_web` è risolta e cachata solo nel processo server
- `GET consultants/sys:public_web` esplicitamente bloccato (403); tutto ciò che non matcha → 403

Client corrispondente: [src/lib/api/automation.ts](../src/lib/api/automation.ts) (lancia `AutomationError`; `consultantApiKey` in localStorage). Tipi: [src/lib/api/automation.types.ts](../src/lib/api/automation.types.ts).

## Proxy SwissCarInfo — [src/app/api/swisscarinfo/search/route.ts](../src/app/api/swisscarinfo/search/route.ts)

Proxy `GET /v3/search` con `X-API-Key` iniettata server-side. Client: [src/lib/api/swisscarinfo.ts](../src/lib/api/swisscarinfo.ts) (`searchBrands`, `searchVehicles`, `searchByTypeApproval`, `searchBySerial`).

## Località svizzere — [src/app/api/localities/route.ts](../src/app/api/localities/route.ts)

Lookup CAP dal CSV federale [src/data/AMTOVZ_CSV_LV95.csv](../src/data/AMTOVZ_CSV_LV95.csv) (491KB, **server-only, mai in public/**), parse una volta per processo. `?plz=6900` esatto, `?plz=69&prefix=1` prefisso. La ricerca vie usa openplzapi.org client-side (in automation.ts `searchStreets`).

## Banner WordPress — [src/lib/api/onezone.ts](../src/lib/api/onezone.ts)

`GET https://onezone.ch/wp-json/wp/v2/banner` per il carousel della Home.
