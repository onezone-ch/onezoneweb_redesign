# Architettura Generale

## Stack

| Tecnologia | Versione | Utilizzo |
|---|---|---|
| Next.js (App Router) | 16.x | Framework (Turbopack) |
| React | 19.x | UI |
| TypeScript | strict | Linguaggio |
| Tailwind CSS | v4 (`@theme` CSS-first) | Stili |
| TanStack Query | v5 + persister localStorage | Data fetching/cache |
| sonner | — | Toast |
| lucide-react | — | Icone (stroke 1.6) |

## Principi

- **Pagine tutte client component**: ogni rotta ha un `page.tsx` server sottile che importa un feature component `"use client"` da `src/features/<area>/`. L'app è 100% dinamica contro API esterne.
- **Parità URL con l'app Angular**: i path non vanno MAI rinominati (email e QR code puntano a `register/:code`, `automation-form-generic-client?lang=`, ecc.).
- **Nota Next 16**: `params`/`searchParams` sono `Promise` — vanno awaitati nei `page.tsx`.

## Route group (4 layout)

```
src/app/
├── layout.tsx                 # font DM Sans, Providers, metadata/favicon
├── providers.tsx              # QueryProvider > I18nProvider > AuthProvider > LoaderProvider + Toaster
├── page.tsx                   # '' → redirect /login o /home
├── not-found.tsx              # wildcard → /login
├── (unauthed)/                # GuestGuard + layout centrato + footer (supporto/onezone/lingua)
├── (public)/                  # layout unauthed SENZA guard né footer (form preventivi pubblico)
├── (authed)/                  # AuthGuard + header (profilo|logo|menu) + footer (supporto/FAQ/home)
├── (pdf)/                     # AuthGuard + header minimale con back, fullscreen
├── (dev)/                     # kitchen-sink e infra-test (404 in produzione)
└── api/                       # route handler proxy (segreti server-side)
```

## File principali

- [src/app/layout.tsx](../src/app/layout.tsx) — root layout, font, metadata
- [src/app/providers.tsx](../src/app/providers.tsx) — albero dei provider
- [src/app/page.tsx](../src/app/page.tsx) — redirect radice
- [src/app/not-found.tsx](../src/app/not-found.tsx) — wildcard → /login
- [src/app/(unauthed)/layout.tsx](../src/app/%28unauthed%29/layout.tsx)
- [src/app/(public)/layout.tsx](../src/app/%28public%29/layout.tsx)
- [src/app/(authed)/layout.tsx](../src/app/%28authed%29/layout.tsx)
- [src/app/(pdf)/layout.tsx](../src/app/%28pdf%29/layout.tsx)
- [src/components/layout/AuthedShell.tsx](../src/components/layout/AuthedShell.tsx) — header/footer authed
- [src/components/layout/UnauthedShell.tsx](../src/components/layout/UnauthedShell.tsx) — chrome unauthed (prop `showFooter`)
- [src/components/layout/PdfShell.tsx](../src/components/layout/PdfShell.tsx) — chrome PDF
- [src/lib/navigation.ts](../src/lib/navigation.ts) — `useNavigator()`: navigateTo (destinationUrl multilingua, link `app://`, esterni), back(), `inMenu`

## Riferimento storico

L'app è la riscrittura di OneZone Web Angular 20 (`/Users/dario/Documents/ONEZONE_APP/onezoneweb_20251219`). La documentazione della migrazione (decisioni, esiti fase per fase) è in [docs/2026-07-18-migrazione-nextjs/00-progetto.md](../docs/2026-07-18-migrazione-nextjs/00-progetto.md).
