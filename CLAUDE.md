@AGENTS.md

# OneZone Web (Next.js) — Documentazione Tecnica

**OneZone Web** è il portale clienti per la gestione di polizze assicurative sul mercato svizzero: polizze, offerte, sinistri, mandati broker e generazione automatica di preventivi auto (EcoHub/scrapers). È la riscrittura completa in **Next.js 16** della precedente SPA Angular 20, con redesign grafico (design system OneZone: DM Sans, accento unico `#254083`, bianco minimale).

## Informazioni generali

| Aspetto | Dettaglio |
|---|---|
| Stack | Next.js 16 (App Router, Turbopack), React 19, TypeScript strict, Tailwind v4 |
| Backend principale | BrokerStar `https://onezone.brokerstar.biz/api/v3` — Bearer JWT 24h in localStorage |
| Backend automazione | API car-scraping via proxy server-side `/api/automation/*` (admin key MAI nel client) |
| Ruoli | cliente, consulente (`login.isSharer`), admin (contact.id 58/25755), partner Wefox |
| Lingue | de (default), fr, it, en — i18n custom, JSON in `src/lib/i18n/messages/` |
| Rotte | ~30, path IDENTICI all'app Angular (contratto con email/QR: non rinominare mai) |
| Pattern pagine | `page.tsx` server sottile → feature component `"use client"` in `src/features/<area>/` |
| Avvio | `npm run dev` · build: `npm run build` · prod: `npx next start` |

## 📖 Indice Wiki — USARE SEMPRE QUESTO INDICE

> **REGOLA OBBLIGATORIA**: ogni volta che bisogna fare una modifica al codice, **consultare prima questo indice** per individuare rapidamente la sezione dell'app interessata e aprire il file wiki relativo: contiene il funzionamento della sezione e i link diretti ai file sorgente coinvolti. Non esplorare il codice alla cieca.

| # | Sezione | Wiki | Contenuto |
|---|---------|------|-----------|
| 1 | Architettura | [wiki/01-architettura.md](wiki/01-architettura.md) | Stack, route group/layout, navigazione, principi (parità URL, Next 16 params Promise) |
| 2 | Design system & UI | [wiki/02-design-system.md](wiki/02-design-system.md) | Token Tailwind `@theme`, 12 componenti UI, autocomplete indirizzo condiviso, kitchen-sink |
| 3 | Infrastruttura | [wiki/03-infrastruttura.md](wiki/03-infrastruttura.md) | i18n, auth/sessione/guard/ruoli, storage (tutte le chiavi), loader, toast, TanStack Query, config |
| 4 | API & backend | [wiki/04-api-backend.md](wiki/04-api-backend.md) | Client BrokerStar (~45 funzioni, semantica errori), proxy automation (allowlist), SwissCarInfo, località CH |
| 5 | Auth (pagine) | [wiki/05-auth-pagine.md](wiki/05-auth-pagine.md) | Login, recover, register (+variante /link), selettore lingua |
| 6 | Shell | [wiki/06-shell.md](wiki/06-shell.md) | Home (banner, menu dinamico, bottone consulente), menu, profilo |
| 7 | Polizze & offerte | [wiki/07-polizze-offerte.md](wiki/07-polizze-offerte.md) | Polizze, dettaglio, aggiungi, comparatori, sinistri, offerte, consulente, firma mandato (canvas) |
| 8 | Clienti & mandati | [wiki/08-clienti-mandati.md](wiki/08-clienti-mandati.md) | Liste clienti (infinite scroll, cache SWR), nuovo cliente, upload mandato, form Wefox |
| 9 | Automazione | [wiki/09-automazione.md](wiki/09-automazione.md) | Setup EcoHub (wizard TOTP), **form preventivi** (la pagina più complessa) + rotta pubblica, pannello admin |
| 10 | PDF viewer | [wiki/10-pdf-viewer.md](wiki/10-pdf-viewer.md) | Viewer file/jasper fullscreen, fix anti-flash |
| 11 | Deploy & env | [wiki/11-deploy-env.md](wiki/11-deploy-env.md) | Variabili d'ambiente, segreti server-only, build/avvio, rotazione chiavi |

## Regole di sviluppo

1. **Prima di ogni modifica**: individuare la sezione nell'indice wiki qui sopra e leggere il file wiki relativo (funzionamento + link ai sorgenti).
2. **Documento di progetto prima del codice**: per nuove funzionalità creare prima un documento in `/docs` (formato `YYYY-MM-DD-HH-mm-nome-funzione.md`) e attendere conferma esplicita prima di implementare.
3. **Non rompere i contratti**: path URL invariati; semantica errori del client BrokerStar (fallback silenziosi) invariata; chiavi localStorage invariate; allowlist del proxy automation è security-critical.
4. **Modifiche chirurgiche**: toccare solo ciò che serve, rispettare lo stile esistente, aggiornare il file wiki della sezione se il funzionamento cambia.
5. **Verifica**: `npm run build` deve restare verde (include il type-check).

## Glossario

| Termine | Descrizione |
|---|---|
| BrokerStar | Backend gestionale assicurativo |
| Tender | Gara/Offerta assicurativa |
| Claim | Sinistro |
| Mandate | Mandato broker |
| EcoHub | Piattaforma da cui gli scrapers generano i preventivi |
| Scraper | Automazione per singola compagnia (axa, Allianz, …) |
| Jasper | Sistema di reportistica PDF (Brokermandat) |
| Contact | Contatto/Cliente/Utente |

## Storia del progetto

Migrazione da Angular documentata in [docs/2026-07-18-migrazione-nextjs/00-progetto.md](docs/2026-07-18-migrazione-nextjs/00-progetto.md) (master + un file per fase con esiti e checklist di verifica finale).
