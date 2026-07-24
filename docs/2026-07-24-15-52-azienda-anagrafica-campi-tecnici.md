# Azienda: anagrafica obbligatoria + campi tecnici veicolo

Data: 2026-07-24

## Contesto

Confronto tra lo schema `QuoteRequest` dell'API `generate-quotes`
(`https://stage-api-car-scraping.onezone.ch/docs`) e il form `automation-form`.

Emergono due allineamenti da fare col contratto backend.

### 1. Anagrafica obbligatoria anche per Azienda
Lo schema richiede **sempre** `first_name`, `last_name`, `birth_date`,
`first_driving_license_date` (mentre `company_name` è opzionale). Il form,
con `gender = Azienda`, nascondeva e svuotava questi campi → HTTP 422
("Field required"). Vanno mostrati e validati anche in modalità Azienda
(rappresentano l'autista dell'azienda — l'hint del campo Nome lo indica già).

### 2. Campi tecnici veicolo (opzionali) auto-popolati dalla ricerca
Lo schema prevede `power_kw_{1,2}`, `displacement_ccm_{1,2}`,
`type_approval_date_{1,2}` (opzionali) non raccolti dal form. Vengono aggiunti
per veicolo 1 e 2 e auto-popolati alla selezione dell'auto dalla ricerca
SwissCarInfo:

| Campo form | Sorgente risposta ricerca |
|---|---|
| `power_kw_N` | `engine.power_kw` |
| `displacement_ccm_N` | `engine.displacement_cc` |
| `type_approval_date_N` | `identification.date_of_approval` (ISO → `DD.MM.YYYY`) |

`catalog_value` escluso su richiesta. Restano non implementati (fuori scope):
`invite_customer`, `customer_email`, `customer_message`.

## Modifiche

- `src/lib/api/automation.types.ts` — `VehicleResult.displacement_cc?`.
- `src/lib/api/swisscarinfo.ts` — `SwissCarInfoItem.engine.displacement_cc?` + map in `mapItem`.
- `src/features/automation-form/formState.ts` — nuovi campi in `FormValues`/`INITIAL_VALUES`;
  validazione anagrafica sempre obbligatoria (company_name solo se Azienda).
- `src/features/automation-form/AutomationFormPage.tsx` — render anagrafica sempre visibile,
  input campi tecnici in `vehicleSection`, auto-fill in `onVehicleSelect`, reset in
  `openVehicleModal`, coercizione numerica nel payload, `fillTestData` aggiornato.
- `src/lib/i18n/messages/{de,fr,it,en}.json` — label `form_power_kw`, `form_displacement`,
  `form_type_approval_date`.

## Nota
Il payload invia `source` (non presente nello schema stage con
`additionalProperties: forbidden`) ma prod risponde 202 → verificare allineamento
stage↔prod separatamente.
