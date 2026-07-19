# Fase 4 — Asset

← [Torna al documento di progetto](00-progetto.md)

**Stato**: ☑ Completata (2026-07-19)
**Dipende da**: [Fase 3](fase-3-pagine.md) (in pratica gli asset vengono copiati man mano che servono; questa fase è il consolidamento finale)

## Obiettivo

Inventario completo degli asset del repo sorgente (`src/assets/`, ~4.9MB totali) con destino: copiare, scartare o sostituire.

## Inventario e destino

| Asset sorgente | Dimensione | Destino |
|---|---|---|
| `assets/i18n/{de,en,fr,it}.json` | 140 KB | **Copiare** in `src/lib/i18n/messages/` (import statici, fatto in fase 1) |
| `assets/data/AMTOVZ_CSV_LV95.csv` | 491 KB | **Copiare** in `src/data/` — server-only, MAI in `public/` (usato da `/api/localities`, fase 1) |
| `assets/data/statics.json` (e altri file in data) | — | **Copiare** in `src/data/` con import statico; verificare cosa è ancora referenziato |
| `assets/icons/` (set PNG `ozo` ecc.) | 3.3 MB | **Sostituire** con lucide-react. Copiare SOLO le icone brand-specifiche non replicabili (loghi assicuratori se presenti qui) |
| `assets/images/` | 396 KB | **Copiare selettivamente** in `public/images/`: logo OneZone, loghi assicuratori, immagini effettivamente referenziate. Scartare il resto |
| `assets/favicons/` | 308 KB | **Copiare** in `public/` + ricostruire i tag (icons, apple-touch, manifest, theme-color) nel `metadata` di `src/app/layout.tsx` |
| `assets/font/` | 272 KB | **Scartare** — DM Sans arriva da `next/font/google` (self-hosted al build) |

## Metadata root layout

Ricostruire in `src/app/layout.tsx`: `title`, `description`, `viewport`, `themeColor` (dal design system: `#254083` o bianco), favicon set completo, `apple-mobile-web-app-*`.

## Criteri di verifica

- [x] Nessun 404 asset nelle pagine navigate (logo, immagini banner remote ok)
- [x] CSV non raggiungibile via HTTP (curl → 404) e assente dal bundle client (grep → 0)
- [x] Favicon set copiato (`public/favicon.ico` + `public/favicons/`) e dichiarato nel metadata del root layout (icons + apple + themeColor #254083); favicon scaffold Next rimosso
- [x] DM Sans self-hosted via next/font (nessuna richiesta esterna runtime)
- [x] Bundle client 1.3MB statici totali; i 4 JSON i18n (~130KB) importati staticamente come da piano

## Esito

Completata il 2026-07-19. Gli asset erano stati copiati incrementalmente durante la fase 3 (i18n JSON in fase 1, statics.json e loghi in fase 2, CSV in fase 1); questa fase ha consolidato favicon + metadata. NOTA: `statics.json` stava in `src/assets/` (non `assets/data/`) nel sorgente; le icone PNG `ozo` sono state integralmente sostituite da lucide-react come previsto.
