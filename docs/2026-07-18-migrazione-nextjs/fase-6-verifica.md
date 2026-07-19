# Fase 6 — Verifica Finale e Cutover

← [Torna al documento di progetto](00-progetto.md)

**Stato**: ◐ In corso (2026-07-19) — verifiche automatiche completate; restano i flussi E2E manuali con account di test
**Dipende da**: tutte le fasi precedenti

## Obiettivo

Verificare la parità funzionale completa contro il backend reale prima del cutover, rotta per rotta, ruolo per ruolo, lingua per lingua.

## 1. Build

- [x] `npm run build` verde (include il check TypeScript di Next 16)
- [x] Nessun errore bloccante

## 1bis. Verifiche automatiche eseguite (2026-07-19)

- [x] Smoke HTTP di tutte le 30+ rotte → 200 (rotta inesistente → 404 + redirect client a /login)
- [x] `next start` produzione: rotte ok, `/api/localities` ok, proxy allowlist 403, `/kitchen-sink` e `/infra-test` → 404 in prod
- [x] Nessun segreto nel bundle client
- [x] Verificate in browser con dati reali durante la fase 3: login/sessione, home, menu, profile, policies (empty), offer, compare, consultant, customers, customers-mandate, customers-mandate-policies, automation-setup (step 1), automation-form (render + validazione + fill test), consultant-automation (admin)

## 2. Checklist rotta-per-rotta (30 path)

Ogni rotta va aperta sia via navigazione interna sia **a freddo con refresh diretto** (deep-link deve funzionare).

| Rotta | Navigata | Deep-link | Note |
|---|---|---|---|
| `/` (redirect) | ☐ | ☐ | → login o home |
| `/login` | ☐ | ☐ | incl. step 2FA se attivo |
| `/recover` | ☐ | ☐ | 2 step completi |
| `/register` | ☐ | ☐ | persona e azienda |
| `/register/:consultantCode` | ☐ | ☐ | assegnazione consulente da URL |
| `/language_unauthed` | ☐ | ☐ | |
| `/automation-form-generic-client` | ☐ | ☐ | senza login + `?lang=` |
| `/home` | ☐ | ☐ | cache-paint |
| `/menu` | ☐ | ☐ | voce admin condizionale |
| `/language` | ☐ | ☐ | |
| `/profile` | ☐ | ☐ | upload avatar/documenti |
| `/link/:contactid` | ☐ | ☐ | |
| `/policies` | ☐ | ☐ | |
| `/policies/:clientid` | ☐ | ☐ | |
| `/policy/:policyid` | ☐ | ☐ | |
| `/policyadd` | ☐ | ☐ | |
| `/policy-select` | ☐ | ☐ | |
| `/compare` | ☐ | ☐ | |
| `/report/:policyid` | ☐ | ☐ | foto add/remove |
| `/offer` + `/offer/:offerid` | ☐ | ☐ | accept/reject |
| `/consultant` + `/:policyid` | ☐ | ☐ | chat polling |
| `/agreement` | ☐ | ☐ | firma canvas |
| `/customers` | ☐ | ☐ | infinite scroll |
| `/customers-mandate` | ☐ | ☐ | SWR paint |
| `/customers-mandate-add` | ☐ | ☐ | autocomplete |
| `/customers-mandate-policies/:id` | ☐ | ☐ | upload PDF |
| `/form-mandate-wefox` | ☐ | ☐ | |
| `/automation-setup` | ☐ | ☐ | wizard completo |
| `/automation-form` | ☐ | ☐ | preventivo reale |
| `/consultant-automation` | ☐ | ☐ | solo admin |
| `/file/:fileid` + `/jasper/...` | ☐ | ☐ | anche Safari/iOS |
| Rotta inesistente | ☐ | ☐ | → `/login` |

## 3. Matrice ruoli × funzionalità

| Verifica | Cliente | Consulente | Admin | Partner Wefox |
|---|---|---|---|---|
| Home (bottoni condizionali) | ☐ | ☐ | ☐ | ☐ |
| Menu (voci condizionali) | ☐ | ☐ | ☐ | ☐ |
| Customers/mandati accessibili | — | ☐ | ☐ | ☐ |
| Consultant-automation | no ☐ | no ☐ | sì ☐ | no ☐ |
| Form Wefox | — | — | — | ☐ |

## 4. i18n

- [ ] Sweep 4 lingue sulle pagine con form grandi (automation-form, register, mandate-add) — label DE/FR più lunghe non rompono il layout
- [ ] Nessun `MISSINGTRANSLATION` visibile (grep sulle pagine renderizzate)
- [ ] Cambio lingua a runtime aggiorna tutto senza reload
- [ ] `?lang=` sulla rotta pubblica forza la lingua

## 5. Sessione e storage

- [ ] Login → refresh → sessione persiste
- [ ] Token scaduto (>24h, simulabile alterando `tokenValidUntil`) → redirect login
- [ ] Logout svuota TUTTO lo storage (incluso persister Query) e riporta a `/login`
- [ ] Valori legacy `selectedLanguage` (es. `english`) letti correttamente

## 6. Flussi end-to-end critici

- [ ] Preventivo pubblico completo senza login (QR → form → submit → polling → risultato)
- [ ] Setup EcoHub → generazione preventivi da consulente
- [ ] Mandato: aggiungi cliente → upload PDF → informa assicurazioni
- [ ] Sinistro con foto
- [ ] Accettazione offerta

## 7. Deploy

- [ ] `next start` dietro reverse proxy funzionante
- [ ] Nessuna regressione CORS (BrokerStar dal browser come oggi; automation/SwissCarInfo ora same-origin)
- [ ] Chiavi assenti dal bundle client
- [ ] Dopo cutover: **rotazione chiavi** (vedi [fase-5](fase-5-env-segreti.md))

## Esito

_(da compilare a fine fase)_
