# Fase 3 — Migrazione Pagine (7 gruppi)

← [Torna al documento di progetto](00-progetto.md)

**Stato**: ☑ Completata (2026-07-19) — tutte le 25 pagine migrate; flussi E2E con submit reali da esercitare in fase 6
**Dipende da**: [Fase 2](fase-2-layout-rotte.md)

## Obiettivo

Migrare tutte le 25 pagine, in 7 gruppi ordinati per dipendenza e rischio. Ogni pagina: `page.tsx` server sottile → feature component `"use client"` in `src/features/<area>/`. Grafica nuova secondo il design system; funzionalità secondo l'inventario `docs/2026-05-22-15-17-struttura-app-per-redesign.md` del repo sorgente (che è la spec di cosa deve contenere ogni schermata).

**Verifica per ogni gruppo**: build verde; ogni pagina esercitata contro il backend reale con account di test; sweep lingua; cache-paint dove previsto.

---

## Gruppo 1 — Auth

| Pagina | Rotta | Endpoint | Note comportamentali |
|---|---|---|---|
| Login | `/login` | `login` (FormData) | Email/password con toggle visibilità, area errore, step 2FA opzionale. Form semplice: useState |
| Recover | `/recover` | `resetPassword`, `confirmResetPassword` | Due step: richiesta email → codice + nuova password |
| Register | `/register`, `/register/:code`, `/link/:contactid` | `registerUser`, `addSubcontact` | Segmented Persona/Azienda; violation per-campo dal backend; autocomplete indirizzo CH (CAP→Città→Via, doc `2026-07-13`) — dipende da `AddressAutocomplete` (gruppo 4): in prima passata campi semplici, autocomplete integrato dopo il gruppo 4. Per Firma: `name1`=Ragione Sociale. `/link` = variante "aggiungi profilo" in layout authed |
| Language | `/language`, `/language_unauthed` | — | Componente condiviso, 4 lingue, scrive `selectedLanguage` |

## Gruppo 2 — Shell

| Pagina | Rotta | Endpoint | Note |
|---|---|---|---|
| Home | `/home` | `customerportalmenu`, banner WP, `GET /consultants/{id}` + `verify-login` (via proxy, cache-first doc `2026-05-25`) | Carousel promo/banner, saluto personalizzato, ListCard menu dinamico, bottoni solo-consulente "Invia mandato" (→`/customers-mandate`) e "Genera preventivi" (→`/automation-form` o `/automation-setup` se non configurato), spinner verifica dati |
| Menu | `/menu` | `customerportalmenu{level}` | Indice sezioni; voce admin "Gestione consulenti" solo per contact.id 58/25755; logout come azione distruttiva; link istituzionale esterno |
| Profile | `/profile` | `userMe`, `userMeUpdate`, `contactRelation`, `contactGetAvatar`, `changeContact*`, `contactFiles`, `uploadProfileFile`, `getDocumentCategoryItemInfo` | Header utente, carousel contatti orizzontale con selezione attiva, "+ Aggiungi profilo" (→`/link`), sezioni collassabili: Dati personali, Indirizzo, Accesso (email/telefono/password), griglia Documenti con upload/apri |

## Gruppo 3 — Polizze / Offerte / Consulente

| Pagina | Rotta | Endpoint | Note |
|---|---|---|---|
| Policies | `/policies`, `/policies/:clientid` | `policyList` (paginazione `forkJoin`→`Promise.all`), `quotation` | Griglia card, bottone aggiungi solo su vista personale, empty state |
| Policy | `/policy/:policyid` | `policy`, `premiumInvoice` | Card riassunto, lista dettagli, copia polizza condizionale, crea sinistro, contatta consulente |
| PolicyAdd | `/policyadd` | `insurance` | Lista assicuratori selezionabili con checkbox/loghi |
| PolicySelect | `/policy-select` | `policyList` | Scelta polizza prima di un'operazione (es. sinistro) |
| Compare | `/compare` | `quotation` + calcolo | Confronto premi/offerte, form parametri, risultati tabella/card |
| Report | `/report/:policyid` | `createClaim`, `claimInformInsurances`, `uploadFile` | Sinistro: data, textarea descrizione, galleria foto orizzontale con add/remove |
| Offers | `/offer`, `/offer/:offerid` | `tender`, `tenderOffer`, `tenderOfferAccept/Reject` | Tab segmentate Sospese/Accettate/Rifiutate con conteggi; tender collassabili; per offerta: accetta/rifiuta/scarica/contatta |
| Consultant | `/consultant`, `/consultant/:policyid` | `chatConversationMessages` (polling), `chatPostMessage`, `chatFloodedChat`, `chatMuteConversation` | Card consulente (foto, email/telefono cliccabili) + chat con polling e check flooding |
| Agreement | `/agreement` | `mandateInformInsurances`, `uploadFile` | Lista check-item, checkbox "mantieni consulente attuale", selezione assicuratori condizionale, download documento, **canvas firma** con clear (portare la logica canvas), link termini, submit |

## Gruppo 4 — Clienti / Mandati

Costruire qui il componente condiviso **`AddressAutocomplete`** (CAP→Località→Via; `/api/localities` + openplzapi client-side; navigazione tastiera ArrowUp/Down/Home/End/Enter/Esc + ARIA combobox/listbox — doc `2026-07-06-20-16`; validator "from API"). Poi integrarlo anche in Register (gruppo 1) e Automation-form (gruppo 5).

| Pagina | Rotta | Endpoint | Note |
|---|---|---|---|
| Customers | `/customers` | `contactContactList`/`loadContactPage` | Ricerca, aggiungi, card cliente con azioni rapide tel/email, badge "Mandato", infinite scroll (IntersectionObserver, doc `2026-03-19`) |
| CustomersMandate | `/customers-mandate` | `GET /contact` singola con `add[…]` e `limit=30` (doc `2026-07-03`) | SWR cache `Map<page, records>` con rebuild (doc `2026-07-06`) → Query persister |
| CustomersMandateAdd | `/customers-mandate-add` | registrazione contatto | Form grande RHF+zod: radio Gender (Mann/Frau), ordine CAP→Località→Indirizzo con autocomplete, Hausnummer concatenato in `address`, mobile obbligatorio, Firma: `name1`=Ragione Sociale/`name2`="" (docs `2026-06-17`, `2026-06-24`, `2026-07-09`) |
| CustomersMandatePolicies | `/customers-mandate-policies/:id` | `contactFiles`, `uploadFile`, `mandateInformInsurances` | Drag&drop upload PDF mandato + multi-checkbox assicuratori (campo `isNew` — doc `2026-05-21-22-12`); griglia polizze cliente |
| FormMandateWefox | `/form-mandate-wefox` | submit mandato Wefox | Form a sezioni con validazione inline, messaggio successo (doc `2026-03-31`) |

## Gruppo 5 — Automazione (rischio massimo)

### AutomationSetup — `/automation-setup`
Wizard 3 step con StepBar: ① credenziali EcoHub → ② upload QR / `extract-totp-secret` (multipart, doc `2026-03-09-17-59`) → ③ verifica con Google Authenticator. Al termine: `checkLogin` con messaggio di attesa ~90s (doc `2026-03-11`). Registrazione/lookup consulente via proxy (gestione 404 → flusso registrazione, doc `2026-03-09-17-52`); `consultantApiKey` persistita in localStorage. Autenticazione a 2 livelli: admin key (server-side) + api_key consulente (doc `2026-03-09-17-38`).

### AutomationForm — `/automation-form` (authed) + `/automation-form-generic-client` (pubblica)
Il pezzo più grande (1915 TS + 1678 HTML nel sorgente). Decomposizione in `src/features/automation-form/`:

| File | Responsabilità |
|---|---|
| `AutomationFormPage.tsx` | Orchestratore + StepBar/progress; prop `publicMode` |
| `schema.ts` | Zod: **tutti** i validator — età patente ≥18 da `first_driving_license_date` (doc `2026-05-26`), select ritiro patente 4 opzioni (doc `2026-06-22-18-43`), selettore tipo richiesta 3 modalità con `registration_scraper`/`registration_only` e visibilità condizionale (doc `2026-06-22-16-50`), `main_driver_type=multiple` solo se gender=Azienda (doc `2026-06-24-14-40`), sub-form `main_driver`, campi V1/V2/Sinistri (storico 5 anni), `electric_vehicle` oggetto 4 checkbox booleane (doc `2026-03-12`), `other_questions` array stringhe tradotte (doc `2026-05-26-18-31`) |
| `steps/*.tsx` | Sezioni: dati personali, veicolo 1, veicolo 2 condizionale, uso/coperture, storico sinistri (con descrizione informativa, doc `2026-05-26-18-04`), altre domande, contatto |
| `VehicleSearchModal.tsx` | Ricerca veicolo via proxy SwissCarInfo: box filtri con dropdown Modello da `action=filters` + `power_min`/`power_max` verso `action=vehicles`, bottoni Filtra/Reset (doc `2026-07-16`); ricerca per type_approval/matricule; tabella risultati sticky-header con paginazione; pre-compilazione `type_approval` (doc `2026-05-18`) |
| `AddressAutocomplete` | Riuso dal gruppo 4 (abilitato solo con `zip_code`+`area` validi, ≥3 char — doc `2026-06-12`) |
| `InsurerScraperSelect.tsx` | Checkbox scrapers da `NEXT_PUBLIC_AUTOMATION_SCRAPERS`, filtrate per `disabled_scrapers` del consulente (doc `2026-05-25-19-05`) |
| `useQuoteSubmit.ts` | Submit → proxy → polling `request_id`/status (doc `2026-03-09-18-03`); `recipient_email` da `consultantData.ecohub_username` (authed) o dal form (public) |
| Modal blocco offerta | Se ≥1 checkbox qualificante della Sezione 6 → modal "Non possibile calcolare l'offerta" + blocco submit (doc `2026-05-26-18-57`) |

Modalità pubblica: stesso componente, `publicMode` da rotta; `source: onezone_cliente` vs `onezone_consulente`; query `?lang=it|de|fr|en` forza la lingua (doc `2026-06-16`); consulente pubblico risolto server-side nel proxy. Il bottone dev "riempi form con dati di esempio" NON va in produzione (spec funzionale).

Contratti: `FRONTEND_FORM_CONTRACT (1).md`, `openapi.json`, doc `2026-06-11` (allineamento payload `POST /generate-quotes`).

## Gruppo 6 — Admin

| Pagina | Rotta | Note |
|---|---|---|
| ConsultantAutomation | `/consultant-automation` | Gate `isAdmin` (58/25755); card consulenti con StatusDot login + badge disabilitato, ricerca; modal per consulente: toggle Attivo + toggle per-scraper; PATCH via proxy admin |

## Gruppo 7 — PDF

| Pagina | Rotta | Note |
|---|---|---|
| File | `/file/:fileid` | `fileInfo` + `file` → base64 → Blob URL → `<iframe>`; port del fix flash "Not supported" (doc `2026-02-11`): non mostrare fallback finché il file non è risolto |
| Jasper | `/jasper/:reportName/:contactId` | `createJasperreport`/`createSignetJasperreport` → stesso viewer |

Test specifico Safari/iOS (utenza mobile-first): comportamento Blob/iframe differisce tra browser.

## Criteri di verifica (per gruppo)

- [x] G1 (2026-07-19): login reale verificato (sessione persistita, GuestGuard→/home da loggati); register (variante /link) renderizzato con segmented Cliente/Ditta, gender radio, autocomplete CAP→Località→Via verificato end-to-end nel browser (690→Lugano→Via Nassa via openplzapi); /language ok; toggle menu ≡/✕ header ok. Recover e violations backend da esercitare con test reali in fase 6. Nota: register usa state+checkData (parità 1:1 col sorgente) invece di RHF+zod — RHF resta per automation-form
- [x] G2 (2026-07-19): home verificata con dati reali (banner WP, saluto, bottone consulente Genera Preventivi, menu dinamico); menu verificato (voci backend, Gestione consulenti admin, logout danger, link web); profile verificato (carousel 7 contatti, sezioni collassabili, edit inline). Modifica dati/upload documenti da esercitare in fase 6
- [x] G3 (2026-07-19): 9 pagine migrate e in build; verificate in browser con backend reale: /policies (empty state), /offer (tab+conteggi), /compare (griglia comparatori con uniqueId), /consultant (card con email/mobile reali). Dettaglio polizza, accept/reject, report con foto e firma agreement da esercitare con account con polizze (fase 6). NOTE: (1) la chat del consulente NON esiste più nel sorgente attuale (component ridotto a card contatti — la wiki era datata); (2) `compare.rent` e `compare.animal` mancano nei 4 JSON i18n anche nell'app Angular (MISSINGTRANSLATION preesistente — da decidere se aggiungere le chiavi)
- [x] G4 (2026-07-19): 5 pagine migrate e in build; verificate in browser con dati reali: /customers e /customers-mandate (card clienti con badge MANDATO, conteggi, azioni tel/email, utente in testa, ricerca con debounce, cache sessionStorage SWR), /customers-mandate-policies/:id (upload PDF + lista assicuratori reale + empty state polizze). Form add cliente e Wefox in build, da esercitare in fase 6
- [x] G5 (2026-07-19): automation-setup (wizard 3 step con StepBar, verificato in browser), automation-form decomposto in `src/features/automation-form/` (options.ts estratte verbatim, validators.ts, formState.ts con validateForm port dei Validators condizionali, VehicleSearchModal, AutomationFormPage ~1000 righe) + rotta pubblica con `?lang=`; verificati in browser: render completo, fill test data (dev), submit bloccato da validazione con errori per campo e toast. Submit REALE (generate-quotes → scrapers) volutamente non eseguito: da fare in fase 6 con account di test. NOTE: (1) request_type nell'originale è un select con opt1='Nur Nachweis bestellen' — corretto un mismatch value/label iniziale; (2) blockOfferModal esiste nel sorgente ma non viene mai aperto (dead code) — non portato il trigger; (3) form con state+validate() invece di RHF+zod (parità più diretta coi Validators Angular)
- [x] G6 (2026-07-19): consultant-automation verificato in browser con dati reali (lista consulenti, ricerca, StatusDot login, badge DISABILITATO, modal toggle attivo/scrapers con optimistic update+rollback via proxy admin). Gate admin su ADMIN_CONTACT_IDS
- [x] G7 (2026-07-19): FileViewerPage (file/:fileid + jasper) migrato in build, con fix flash 'not supported' (stato loading iniziale). Apertura con file reale + test Safari/iOS in fase 6

## Esito

_(da compilare a fine fase, gruppo per gruppo)_
