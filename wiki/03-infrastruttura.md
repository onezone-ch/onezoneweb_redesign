# Infrastruttura Core (i18n, auth, storage, loader, toast, query)

## i18n — [src/lib/i18n/I18nProvider.tsx](../src/lib/i18n/I18nProvider.tsx)

- 4 lingue: de (default), fr, it, en. JSON in [src/lib/i18n/messages/](../src/lib/i18n/messages/) (copiati verbatim dall'app Angular, import statici).
- Risoluzione: localStorage `selectedLanguage` (incl. valori legacy `english/french/italian`) → lingua browser → `de`.
- `useI18n()` → `{ lang, setLang, t }`; `t("gruppo.chiave")` o `t("gruppo", "chiave")`, fallback `'MISSINGTRANSLATION'`.
- `langToNumeric()`: de=1, fr=2, it=3, en=4 (payload BrokerStar).
- Cambio lingua a runtime = re-render del context (niente reload).

## Auth — [src/lib/auth/](../src/lib/auth/)

- [AuthProvider.tsx](../src/lib/auth/AuthProvider.tsx) — sessione: `token` + `tokenValidUntil` (now+24h) + `userData` in localStorage (stesse chiavi dell'app Angular). `isLogged()`, `startSession`, `endSession` (svuota TUTTO lo storage), `logout`, `getUserName(type,name1,name2)`, flag `ready` per i guard.
- [guards.tsx](../src/lib/auth/guards.tsx) — `AuthGuard` (privato → /login) e `GuestGuard` (loggato → /home), usati nei layout dei route group.
- [roles.ts](../src/lib/auth/roles.ts) — `ADMIN_CONTACT_IDS = [58, 25755]`, `isAdmin()`.
- Ruolo consulente: `isTrue(userData.login?.isSharer)` (vedi Home).

## Storage — [src/lib/storage.ts](../src/lib/storage.ts)

Wrapper localStorage SSR-safe + `clearOldVersions()` (chiave `version`). Chiavi usate: `token`, `tokenValidUntil`, `userData`, `selectedLanguage`, `version`, `consultantApiKey`, `consultantData`, `consultantDisabledScrapers`, `consultantLoginCheck`, `bannerData`, `customerportalmenu{level}`, `quotations`, `selectedPolicies`, `onezone-query-cache`; sessionStorage: `customers-cache`, `customers-mandate-cache`.

## Helper — [src/lib/helper.ts](../src/lib/helper.ts)

Port da Angular: `isset`, `isTrue`, `trim`, `clone`, `convertStringToJSON`, `getDatetimeFromTimestamp`, `delay`…

## Loader — [src/lib/loader/LoaderProvider.tsx](../src/lib/loader/LoaderProvider.tsx)

Overlay globale a contatore: `useLoader().show()/hide()/reset()`.

## Toast — [src/lib/toaster.tsx](../src/lib/toaster.tsx)

Wrapper sonner con la stessa API del ToasterService Angular: `toaster.success/warn/alert/primary/accent`. `<Toaster/>` montato in providers.

## Data layer — [src/lib/query/QueryProvider.tsx](../src/lib/query/QueryProvider.tsx)

TanStack Query v5 + `persistQueryClient` su localStorage (`onezone-query-cache`, maxAge 24h, staleTime 0 = SWR). Nota: molte pagine usano ancora fetch diretti + cache manuali (parità col sorgente); il persister è disponibile per hook futuri.

## Config — [src/lib/config.ts](../src/lib/config.ts)

`publicConfig` (URL BrokerStar, lista scrapers) e `getServerConfig()` (chiavi segrete, lancia se importato client-side). Vedi [08-deploy-env.md](08-deploy-env.md).
