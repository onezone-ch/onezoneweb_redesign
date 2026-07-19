# Design System e Componenti UI

## Token (Tailwind v4, blocco `@theme`)

Definiti in [src/app/globals.css](../src/app/globals.css). Fonte: design system OneZone (`/Users/dario/Documents/Claude/dashboard-car-automation/docs/OneZone Design System.html`).

- **Colori**: `brand #254083` (unico accento — azioni primarie/focus/selezione), `brand-dark #1A2F60`, `tint #EEF1F8`, `tint-2 #F5F7FB`, `ink #14182A`, `ink-2 #3B4358`, `muted #7D8499`, `border #E6E8EE`, `border-soft #EFF1F5`, `success #1F7A4D`/`success-bg`, `danger #A8324B`/`danger-bg`, `warn #8A6116`/`warn-bg`, `bg #FAFAFC`. **Zero gradienti, zero colori decorativi.**
- **Font**: DM Sans 400/500/600/700 via `next/font/google` (variabile `--font-dm-sans`).
- **Radii**: `rounded-10/11/12/14/16/18/24` (chip 10-11, input/bottoni 12, card 14-16, modal 18-24).
- **Ombre**: `shadow-card` (solo elementi flottanti), `shadow-float` (modal), `shadow-seg` (segmented attivo).
- **Tipografia**: Display 32/700, Headline 28/700, Title 18/700, Body 15/500, small 13, eyebrow 11/600 uppercase LS 0.6. Gerarchie da peso+size, mai dal colore.

## Componenti (`src/components/ui/`, barrel `index.ts`)

| Componente | File | Note |
|---|---|---|
| Button | [Button.tsx](../src/components/ui/Button.tsx) | primary/secondary/ghost/danger × md(h-48)/sm, prop `icon`, `fullWidth` |
| Input/Select/Textarea | [Field.tsx](../src/components/ui/Field.tsx) | label eyebrow, focus ring tint, stato errore, password toggle, `forwardRef` |
| Badge | [Badge.tsx](../src/components/ui/Badge.tsx) | blue/success/danger/warn/solid, 10px uppercase |
| Eyebrow | [Eyebrow.tsx](../src/components/ui/Eyebrow.tsx) | tone muted/brand |
| Card | [Card.tsx](../src/components/ui/Card.tsx) | prop `floating` per shadow-card |
| Segmented | [Segmented.tsx](../src/components/ui/Segmented.tsx) | generico su union string, variante `fullWidth` + `count` (tab offerte) |
| ListCard/ListRow | [ListCard.tsx](../src/components/ui/ListCard.tsx) | righe icona-chip 36px + titolo/sotto + chevron (home, menu) |
| StepBar | [StepBar.tsx](../src/components/ui/StepBar.tsx) | progress a segmenti per i wizard |
| StatusDot | [StatusDot.tsx](../src/components/ui/StatusDot.tsx) | pallino 8px success/muted/danger/warn |
| Modal | [Modal.tsx](../src/components/ui/Modal.tsx) | esc/overlay, bottom-sheet su mobile, `maxWidth` |
| Spinner/LoaderOverlay | [Spinner.tsx](../src/components/ui/Spinner.tsx) | usato dal LoaderProvider |
| EmptyState | [EmptyState.tsx](../src/components/ui/EmptyState.tsx) | liste vuote |
| HScroll | [HScroll.tsx](../src/components/ui/HScroll.tsx) | scroller orizzontale senza scrollbar, drag-to-scroll col mouse (banner home, contatti profilo) |

## Componenti condivisi (`src/components/shared/`)

- [useAddressAutocomplete.ts](../src/components/shared/useAddressAutocomplete.ts) — hook autocomplete indirizzo CH (CAP→Località→Via): prefissi da `/api/localities`, vie da openplzapi, debounce 350ms, navigazione tastiera, validazioni `isPlzValid/isCityValid/isAddressValid`, `cacheVersion` per ricalcolo errori, opzione `onSelectLocality` (imposta il cantone). Usato da register, customers-mandate-add, automation-form (×2: form principale + main_driver).
- [AddressFields.tsx](../src/components/shared/AddressFields.tsx) — i 3 campi con dropdown ARIA combobox/listbox.

## Pagina di confronto

- `/kitchen-sink` ([src/app/(dev)/kitchen-sink/](../src/app/%28dev%29/kitchen-sink/KitchenSink.tsx)) — showcase di tutti i componenti; 404 in produzione.
