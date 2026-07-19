# Fase 0 — Scaffold Next.js + Design Token + UI Kit

← [Torna al documento di progetto](00-progetto.md)

**Stato**: ☑ Completata (2026-07-18)
**Fonte design**: `/Users/dario/Documents/Claude/dashboard-car-automation/docs/OneZone Design System.html`

## Obiettivo

Creare il progetto Next.js e tradurre il design system HTML in token Tailwind v4 + libreria di componenti React riusabili. Nessuna logica di business in questa fase.

## 1. Scaffold

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --eslint --no-import-alias
```

- `next.config.ts` di default (nessuna config speciale per ora).
- TypeScript `strict: true`.
- Dipendenze aggiuntive fase 0: `lucide-react`, `clsx` (o `tailwind-merge` se serve).

## 2. Design token (`src/app/globals.css`, blocco `@theme`)

### Colori

| Token | Valore | Uso |
|---|---|---|
| `--color-brand` | `#254083` | Azioni primarie, focus, icone attive, indicatori selezione |
| `--color-brand-dark` | `#1A2F60` | Hover, avatar |
| `--color-tint` | `#EEF1F8` | Fondo icone, badge blu, focus ring |
| `--color-tint-2` | `#F5F7FB` | Box informativi, riga tabella attiva |
| `--color-ink` | `#14182A` | Testo primario, titoli |
| `--color-ink-2` | `#3B4358` | Testo secondario, corpo |
| `--color-muted` | `#7D8499` | Label, meta, placeholder |
| `--color-border` | `#E6E8EE` | Bordi input, divisori forti |
| `--color-border-soft` | `#EFF1F5` | Bordi card, divisori leggeri |
| `--color-success` / `--color-success-bg` | `#1F7A4D` / `#E6F2EB` | Mandato firmato, TOTP ok |
| `--color-danger` / `--color-danger-bg` | `#A8324B` / `#F8E9ED` | Logout, rimuovi, rifiuta, errori |
| `--color-warn` / `--color-warn-bg` | `#8A6116` / `#FFF4E0` | Avvisi, stati in attesa |
| `--color-bg` | `#FAFAFC` | Fondo schermate autenticate |
| `--color-placeholder` | `#A8AEBE` | Placeholder input |

### Tipografia

- **Font**: DM Sans (400/500/600/700) via `next/font/google` nel root layout; DM Mono solo se serve per valori tecnici.
- Scala (size / weight / letter-spacing):

| Stile | Spec |
|---|---|
| Display | 32 / 700 / -1px |
| Headline | 28 / 700 / -0.7px |
| Title | 18 / 700 / -0.4px |
| Body | 15 / 500 |
| Body small | 13 / 400, colore ink-2 |
| Eyebrow | 11 / 600 / LS 0.6 / UPPERCASE, colore muted |

- **Regola**: gerarchie da peso+dimensione, mai dal colore. Minimo assoluto 11px (eyebrow/badge), corpo mai sotto 13px (label DE/FR più lunghe).

### Radii e ombre

| Elemento | Radius |
|---|---|
| Chip icona | 10–11 |
| Input / bottone | 12 |
| Card | 14–16 |
| Hero / sheet / modal | 18–24 |
| Pill / avatar | 999 |

| Ombra | Valore |
|---|---|
| `card` | `0 6px 20px rgba(20,30,60,0.08), 0 0 0 1px rgba(20,30,60,0.04)` |
| `float` | `0 30px 60px rgba(20,30,60,0.10), 0 0 0 1px rgba(20,30,60,0.06)` |

Ombre solo per elementi flottanti (card promo, drop-zone, modal). Separatori 1px.

### Principi (guida per ogni componente)

1. **Un solo accento**: `#254083` per ogni azione primaria/focus/selezione, niente colori decorativi, 0 gradienti.
2. **Bianco è il vuoto**: card su bianco o grigio appena percettibile.
3. **Densità calma**: radius 14–18, separatori sottili, ombre minime.
4. **Tipografia portante**: gerarchie da peso/size.

## 3. Componenti UI (`src/components/ui/`)

| Componente | Specifiche |
|---|---|
| `Button` | Varianti: `primary` (blu pieno, testo bianco), `secondary` (bianco, bordo border, testo ink), `ghost` (fondo tint, testo brand), `danger` (fondo danger-bg, testo danger). Size: md (h-48, 15px/600, radius 12, padding 13×18), sm (padding 9×14, 13px). Full-width su mobile. Prop `icon` (lucide). |
| `Field` + `Input`/`Select`/`Textarea` | Label eyebrow (12.5px muted 500) sopra il campo; h-48, padding 0 14, bordo 1px border, radius 12, testo 15px ink; placeholder `#A8AEBE`. Focus: bordo brand + ring `0 0 0 3px tint`. Errore: label e bordo danger. `forwardRef` per compatibilità react-hook-form. Variante password con toggle mostra/nascondi. |
| `Badge` | 10px / 700 / LS 0.5 / UPPERCASE, padding 3×8, radius 6. Varianti: blue (tint/brand), success, danger, warn. |
| `Segmented` | Contenitore `#F1F2F6` radius 12 padding 4; seg attivo bianco con ombra `0 1px 2px rgba(20,24,42,0.06)`, 13px/600. Variante tab full-width con conteggi (badge blu pieno sull'attivo) per la pagina offerte. |
| `Card` | Bianco, bordo border-soft, radius 16, padding 20. |
| `ListCard` / `ListRow` | Card contenitore con righe: chip icona 36×36 radius 11 fondo tint icona brand + titolo 14.5/600 + sottotitolo 12 muted + chevron destro. Righe separate da bordo border-soft 1px. Riga cliccabile → navigazione. |
| `Eyebrow` | 11px/600 LS 0.6 uppercase muted (o brand per titoli sezione). |
| `StepBar` | Segmenti 28×4 radius 2: completato brand (o success), attivo brand 40% opacity, futuro `#E4E7EF`. Per wizard automation-setup e automation-form. |
| `Modal` | Overlay + pannello radius 18–24, ombra float. Chiusura esc/overlay. Usato da: vehicle search, blocco offerta, conferme. |
| `LoaderOverlay` / `Spinner` | Overlay globale (per LoaderProvider fase 1) + spinner contestuale di sezione. |
| `EmptyState` | Icona + messaggio + eventuale CTA, per liste vuote (polizze, offerte, clienti). |
| `StatusDot` | Pallino 8px (success/muted/danger) + label 13px ink-2 — stati login/scraper. |

Icone: `lucide-react`, sempre `strokeWidth={1.6}`, 24px grid (18px dentro chip). Set di riferimento nel design system: shield, file, car, home, user, bell, spark, search, plus, check, phone, mail, download, upload, camera, calendar, zap, globe, qr, lock, edit, logout, alert, briefcase.

## 4. Kitchen sink

`src/app/(dev)/kitchen-sink/page.tsx`: pagina che mostra tutti i componenti in tutte le varianti/stati (default, focus, errore, disabled). Serve per confronto visivo affiancato con il design system HTML. Protetta da check `NODE_ENV !== 'production'` (o eliminata a fine progetto).

## Criteri di verifica

- [x] `npm run build` verde (include check TypeScript, Next 16/Turbopack)
- [x] Kitchen-sink verificata nel browser: colori, radii, tipografia e componenti combaciano col design system
- [x] Font DM Sans caricato via next/font (self-hosted)
- [x] Layout responsive (grid con breakpoint sm:, bottoni full-width disponibili)

## Esito

Completata il 2026-07-18. Note:
- Scaffold con **Next.js 16.2.10** (Turbopack) — non 15: `params`/`searchParams` sono Promise (nota in fase-2).
- Token in `src/app/globals.css` (`@theme` Tailwind v4); DM Sans 400/500/600/700 via `next/font/google`.
- 12 componenti in `src/components/ui/` + barrel `index.ts`: Button, Input/Select/Textarea (con FieldLabel/FieldError, password toggle), Badge (incl. variante `solid` per conteggi tab), Eyebrow, Card (prop `floating`), Segmented (variante fullWidth+count), ListCard/ListRow, StepBar, StatusDot, Modal (esc/overlay, bottom-sheet su mobile), Spinner/LoaderOverlay, EmptyState.
- Kitchen-sink su `/kitchen-sink`, `notFound()` in produzione.
- Verifica visiva eseguita in Chrome su tutte le sezioni, modal incluso.
