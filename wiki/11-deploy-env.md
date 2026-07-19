# Deploy, Env e Segreti

## Variabili d'ambiente

Template committato: [.env.example](../.env.example) · valori reali in `.env.local` (mai committato). Modulo: [src/lib/config.ts](../src/lib/config.ts).

| Variabile | Scope | Uso |
|---|---|---|
| `NEXT_PUBLIC_BROKERSTAR_API_URL` | pubblica | Base BrokerStar (chiamata dal browser col Bearer utente) |
| `NEXT_PUBLIC_AUTOMATION_SCRAPERS` | pubblica | Lista scrapers per il form automation |
| `NEXT_PUBLIC_SWISSCARINFO_BRANDS_URL` | pubblica | brands.php (endpoint senza chiave) |
| `AUTOMATION_API_URL` | **server-only** | Base API car-scraping |
| `AUTOMATION_ADMIN_API_KEY` | **server-only** | ⚠️ da RUOTARE al cutover |
| `SWISSCARINFO_API_URL` / `SWISSCARINFO_API_KEY` | **server-only** | ⚠️ chiave da RUOTARE al cutover |

Regola: i segreti passano SOLO dai route handler in [src/app/api/](../src/app/api/) (vedi [04-api-backend.md](04-api-backend.md)). Mai importare `getServerConfig()` in codice client (lancia).

## Build e avvio

```bash
npm run dev      # sviluppo (pagine (dev)/ attive)
npm run build    # build produzione (include type-check)
npx next start   # server produzione (pagine (dev)/ → 404)
```

Deploy previsto: server Node dietro reverse proxy. Automation e SwissCarInfo sono same-origin via proxy → nessun problema CORS.

## Documentazione di progetto

La storia della migrazione Angular→Next (decisioni, esiti, checklist di verifica finale con i punti manuali rimasti) è in [docs/2026-07-18-migrazione-nextjs/](../docs/2026-07-18-migrazione-nextjs/00-progetto.md).
