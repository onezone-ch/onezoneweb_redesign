# Fase 2 — Layout e Scheletro Rotte

← [Torna al documento di progetto](00-progetto.md)

**Stato**: ☑ Completata (2026-07-18) — toggle menu header da verificare da loggati (fase 3)
**Dipende da**: [Fase 1](fase-1-infrastruttura.md)

## Obiettivo

Creare i 3+1 layout (unauthed, public, authed, pdf) come route group dell'App Router e tutte le ~30 rotte come pagine placeholder nel chrome corretto, con guard e redirect funzionanti. **I path devono restare identici agli attuali**: gli URL sono un contratto (email puntano a `register/:code`, QR a `automation-form-generic-client?lang=`).

## 1. Albero route group

```
src/app/
  layout.tsx                  # font DM Sans, provider: QueryClient, I18n, Auth, Toaster
  page.tsx                    # redirect client → /login (o /home se loggato)
  not-found.tsx               # redirect → /login (parità wildcard '**' Angular)

  (unauthed)/layout.tsx       # GuestGuard + layout centrato (logo) + footer:
    login/                    #   supporto, link onezone.ch, selettore lingua
    recover/
    register/[[...consultantCode]]/
    language_unauthed/

  (public)/layout.tsx         # stesso layout visivo unauthed, NESSUN guard
    automation-form-generic-client/

  (authed)/layout.tsx         # AuthGuard + header (profilo | logo | menu/close) +
    home/                     #   footer (supporto/FAQ/home) + LoaderOverlay
    menu/
    language/
    profile/
    link/[contactid]/
    policies/[[...clientid]]/
    policy/[policyid]/
    policyadd/
    policy-select/
    compare/
    consultant/[[...policyid]]/
    offer/[[...offerid]]/
    report/[policyid]/
    agreement/
    customers/
    customers-mandate/
    customers-mandate-add/
    customers-mandate-policies/[id]/
    automation-setup/
    automation-form/
    form-mandate-wefox/
    consultant-automation/

  (pdf)/layout.tsx            # AuthGuard + header minimale con back, fullscreen
    file/[fileid]/
    jasper/[reportName]/[contactId]/
```

## 2. Mappa rotta Angular → cartella Next

| Rotta Angular | Cartella Next | Note |
|---|---|---|
| `''` → redirect `/login` | `page.tsx` root | Redirect client-side: `/home` se loggato, `/login` altrimenti |
| `login`, `recover`, `language_unauthed` | `(unauthed)/...` | |
| `register` + `register/:consultantCode` | `(unauthed)/register/[[...consultantCode]]` | Optional catch-all: il param arriva come array `[code]` o undefined |
| `automation-form-generic-client` | `(public)/automation-form-generic-client` | `data.publicMode=true` → prop `publicMode` sul componente |
| `home`…`consultant-automation` | `(authed)/...` | |
| `policies` + `policies/:clientid` | `(authed)/policies/[[...clientid]]` | |
| `consultant` + `consultant/:policyid` | `(authed)/consultant/[[...policyid]]` | |
| `offer` + `offer/:offerid` | `(authed)/offer/[[...offerid]]` | |
| `link/:contactid` | `(authed)/link/[contactid]` | Register in variante "aggiungi contatto", layout authed |
| `file/:fileid`, `jasper/:reportName/:contactId` | `(pdf)/...` | |
| `**` → redirect `/login` | `not-found.tsx` | |

> **Nota Next 16**: `params` e `searchParams` sono `Promise` — nelle pagine dinamiche e nei route handler vanno awaitati (`const { policyid } = await params`). Nei client component si usa `use(params)` o si riceve il valore già risolto dal `page.tsx` server sottile.

## 3. Guard e redirect

| Guard | Comportamento (parità `group.guard.ts`) |
|---|---|
| `AuthGuard` (authed, pdf) | Se `!isLogged()` → redirect `/login`. Durante `loadSession()` → loader, non flash di contenuto |
| `GuestGuard` (unauthed) | Se `isLogged()` → redirect `/home` |
| Nessun guard (public) | La rotta pubblica del form resta accessibile sempre |
| Gate admin | `consultant-automation` verifica in-page `isAdmin(userData)` (contact.id 58/25755) → altrimenti redirect `/home` |

## 4. Header authed e navigazione (`src/lib/navigation.ts`)

Port di `navigator.service.ts` — **da portare con cura**:

- `navigate(path)` → `router.push`
- `back()` → semantica history: se c'è history interna torna indietro, altrimenti fallback a `/home` (verificare comportamento esatto nel sorgente durante l'implementazione)
- **`inMenu`**: stato che governa il toggle del bottone header (icona menu ↔ icona chiudi). Aprire il menu naviga a `/menu` e cambia l'icona; chiudere torna alla pagina precedente. In Next: stato nel layout authed derivato da `usePathname() === '/menu'` + history back.
- `getLanguage()` → delega a i18n.

Header authed (design system): profilo a sinistra, logo centro, menu/close a destra — superfici bianche, accento blu singolo (niente gradiente header della vecchia UI). Footer authed: supporto, FAQ, home.

## Criteri di verifica

- [x] Tutte le ~30 rotte in build (route table completa, screenshot browser ok)
- [x] Da sloggato: `/home` → redirect `/login`; `/login` visibile; `/automation-form-generic-client` visibile senza login e senza footer
- [~] Da loggato: `/login` → `/home` — da verificare col primo login reale (fase 3 gruppo 1)
- [~] Refresh a freddo su `/policy/123`: la rotta esiste in build; comportamento completo verificabile da loggati
- [x] Rotta inesistente → `/login` (verificato in browser)
- [x] Header lingua unauthed (logo + ✕) funzionante su `/language_unauthed`; toggle ≡/✕ authed da verificare da loggati
- [x] Build verde

## Esito

Completata il 2026-07-18. Note:
- `inMenu` derivato dal pathname (`/menu`, `/language_unauthed`) invece del flag imperativo del NavigatorService: stesso comportamento, meno stato.
- `navigateTo` porta la logica destinationUrl{,E,I,F} (suffisso lingua per gli oggetti menu), link `app://` e URL esterni in nuova tab.
- Nuovo chrome per il design system: header bianco bordo 1px (niente gradiente blu), footer 3 voci con icone lucide + label eyebrow, accento unico blu.
- `statics.json` copiato in `src/data/` (link supporto/FAQ/website per lingua).
- Loghi OneZone (pos/neg SVG) in `public/images/`.
- File: `src/lib/navigation.ts`, `src/components/layout/{AuthedShell,UnauthedShell,PdfShell,Placeholder}.tsx`, 4 layout di gruppo, 27 pagine placeholder, root redirect, not-found.
