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

## Deploy su Coolify

Immagine container via [Dockerfile](../Dockerfile) (multi-stage, output `standalone` in [next.config.ts](../next.config.ts)) + [.dockerignore](../.dockerignore).

**Setup applicazione:**
1. Coolify → *New Resource* → *Application* → sorgente Git (repo `onezoneweb_redesign`, branch `main`).
2. **Build Pack: `Dockerfile`** (autorilevato).
3. **Port: `3000`** (esposta dal container).
4. Coolify gestisce reverse proxy + HTTPS (Traefik/Caddy): impostare il dominio nella scheda del servizio.

**Environment Variables (scheda *Environment*):**

| Variabile | Tipo Coolify | Note |
|---|---|---|
| `NEXT_PUBLIC_BROKERSTAR_API_URL` | **Build Variable** ✔ | inlined a build-time (vedi ARG nel Dockerfile) |
| `NEXT_PUBLIC_AUTOMATION_SCRAPERS` | **Build Variable** ✔ | idem |
| `AUTOMATION_API_URL` | Runtime | server-only |
| `AUTOMATION_ADMIN_API_KEY` | Runtime | ⚠️ segreto, ruotare al cutover |
| `SWISSCARINFO_API_URL` | Runtime | server-only |
| `SWISSCARINFO_API_KEY` | Runtime | ⚠️ segreto, ruotare al cutover |

> Le `NEXT_PUBLIC_*` hanno già i valori di produzione come default in `config.ts`: se non le si sovrascrive la build funziona comunque. I segreti server-only vanno **solo** come Runtime (non come Build Variable) e mai committati.

**Build/deploy locale di prova:**
```bash
docker build -t onezoneweb .
docker run --rm -p 3000:3000 --env-file .env.local onezoneweb
```

## Documentazione di progetto

La storia della migrazione Angular→Next (decisioni, esiti, checklist di verifica finale con i punti manuali rimasti) è in [docs/2026-07-18-migrazione-nextjs/](../docs/2026-07-18-migrazione-nextjs/00-progetto.md).
