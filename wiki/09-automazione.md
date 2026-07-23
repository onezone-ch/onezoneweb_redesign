# Sezione Automazione (setup EcoHub, form preventivi, admin)

## AutomationSetup — `/automation-setup`

[src/features/automation/AutomationSetupPage.tsx](../src/features/automation/AutomationSetupPage.tsx) · rotta [src/app/(authed)/automation-setup/page.tsx](../src/app/%28authed%29/automation-setup/page.tsx)

Wizard 3 step (StepBar): ① credenziali EcoHub + n. provvigione → ② QR TOTP (paste o file, preview, `extract-totp-secret` multipart) → ③ istruzioni Google Authenticator. Submit: `registerConsultant` (409 = già registrato → ok) → `updateConsultant` credentials → `checkLogin` timeout 90s → successo salva `consultantData` → `/automation-form`; fallimento → reset a step 1.

## AutomationForm — `/automation-form` (authed) e `/automation-form-generic-client` (pubblica)

Cartella [src/features/automation-form/](../src/features/automation-form/) — la pagina più complessa dell'app, decomposta:

| File | Responsabilità |
|---|---|
| [AutomationFormPage.tsx](../src/features/automation-form/AutomationFormPage.tsx) | Orchestratore: stato, side-effect condizionali (gender Company↔persona, leasing→Full, request_type→reset campi), submit col payload esatto del contratto API, error display backend (detail FastAPI), success screen, fill test data (solo dev), prop `publicMode` |
| [formState.ts](../src/features/automation-form/formState.ts) | `INITIAL_VALUES`, getter di visibilità (`showVehicle2`, `isRegistrationOnly`…), **`validateForm()`** — port completo dei Validators Angular con le regole condizionali |
| [validators.ts](../src/features/automation-form/validators.ts) | Regex (data gg.mm.aaaa, mm.aaaa, n. omologazione `\d[A-Za-z]{2}\d{3}`, matricola 9 cifre, telefono), età ≥18 (a oggi e alla data patente), seriale "ovvio", email senza `+`, formattazione live delle date |
| [options.ts](../src/features/automation-form/options.ts) | 28 option arrays estratte VERBATIM dal sorgente (nazioni, cantoni, assicurazioni, 123 società di leasing, franchigie…) — label = chiavi i18n `automation.*` |
| [VehicleSearchModal.tsx](../src/features/automation-form/VehicleSearchModal.tsx) | Ricerca veicolo: matricola (9 cifre auto-search) / n. omologazione (≥6 char) / marca (autocomplete) + **barra filtri esatti** (Modello dropdown ricercabile, Carburante select dinamico, Potenza kW min/max, Filtra/Reset — SwissCarInfo v3 `lists=models,fuels` + `brand/model/fuel/power_*`; alla scelta del modello i carburanti si restringono e il filtro parte automaticamente); tabella sticky-header con paginazione; selezione → compila brand/model/n_certificate(/serial se matricola) |

Punti critici:
- **request_type** (select nel sorgente, radio qui): `'Nur Nachweis bestellen'` (solo immatricolazione: `registration_only=true`, niente scrapers), `'Vergleich Versicherungsangebote'` (default: scrapers ≥1), `'Offerte und Nachweis nur von dieser Versicherung'` (`registration_only=false` + `submit_vehicle_proof_*` required).
- **main_driver_type**: `user`/`other` (sub-form completo con proprio autocomplete indirizzo)/`multiple` (solo se gender=Company).
- **Payload**: `electric_vehicle` oggetto con 4 boolean; `other_questions` stringa concatenata delle checkbox tradotte; `license_withdrawal_5_years` solo se ≠ none; `source` = `onezone_cliente`/`onezone_consulente`; `recipient_email` = form (public) o `consultantData.ecohub_username`.
- **Modalità pubblica**: `?lang=it|de|fr|en` forza la lingua; submit via proxy `public/generate-quotes`; scrapers non filtrati.
- **Modalità consulente**: scrapers = env meno `consultantDisabledScrapers`.

## ConsultantAutomation (admin) — `/consultant-automation`

[src/features/automation/ConsultantAutomationPage.tsx](../src/features/automation/ConsultantAutomationPage.tsx) · rotta [src/app/(authed)/consultant-automation/page.tsx](../src/app/%28authed%29/consultant-automation/page.tsx)

Gate `isAdmin` (redirect /home). Lista consulenti (`getConsultants` via proxy admin), ricerca client-side, StatusDot login, badge DISABILITATO. Modal per consulente: toggle Attivo + toggle per-scraper (`patchConsultant`, optimistic update con rollback su errore).
