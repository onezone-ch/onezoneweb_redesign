# Sezione Clienti e Mandati (solo consulenti)

| Pagina | Rotta | Feature component |
|---|---|---|
| Clienti | `/customers` | [CustomersPage.tsx](../src/features/customers/CustomersPage.tsx) |
| Clienti mandato | `/customers-mandate` | [CustomersMandatePage.tsx](../src/features/customers/CustomersMandatePage.tsx) |
| Nuovo cliente | `/customers-mandate-add` | [CustomersMandateAddPage.tsx](../src/features/customers/CustomersMandateAddPage.tsx) |
| Polizze cliente + upload mandato | `/customers-mandate-policies/:id` | [CustomersMandatePoliciesPage.tsx](../src/features/customers/CustomersMandatePoliciesPage.tsx) |
| Mandato Wefox | `/form-mandate-wefox` | [FormMandateWefoxPage.tsx](../src/features/customers/FormMandateWefoxPage.tsx) |

## Customers (`/customers`)

- Ricerca con debounce 300ms (reset paginazione; con ricerca attiva la cache è bypassata).
- Infinite scroll sul `<main>` (soglia 200px dal fondo).
- **Due chiamate per pagina**: base (`limit 15`) per il paint veloce + enrich (`limit 50`, `add[has_mandate_file|policy_count|sub_contact_count]`) in background.
- Cache sessionStorage `customers-cache` per pagina, TTL 5 min, revalidate in background.
- Utente auth in testa alla pagina 1. Card: badge MANDATO, conteggi, indirizzo, azioni tel/email (priorità phoneDirect→phonePrivate→phoneWork→mobile). Click → `/policies/:id`.

## CustomersMandate (`/customers-mandate`)

Come Customers ma: **una sola chiamata** per pagina (`limit 30` con tutti gli `add[…]`), cache `customers-mandate-cache` con `Map<page,records>` e rebuild (gestisce add/delete/reorder backend durante la revalidate), guard `userHasScrolled` sull'infinite scroll. Click → `/customers-mandate-policies/:id`.

## CustomersMandateAdd

Come Register (vedi [05-auth-pagine.md](05-auth-pagine.md)) ma: niente campo password (fissa `123456789`), `sharer` = contatto del consulente (da `userMe`), `invitationCode` dal campo `fax` del consulente, `_sendMail false`. A successo: invalida `customers-mandate-cache` → `/customers-mandate-policies/:newId`.

## CustomersMandatePolicies

- Carica contatto con **retry ×3 + reload** (race post-creazione share consulente↔contatto: la GET può tornare 403).
- Se `hasMandateFile=false` (o non-prod): sezione upload PDF mandato + multi-checkbox assicuratori → `uploadProfileFile(entryid=1)` + `mandateInformInsurances(isNew=true, contactLoginId=permissions.id)`.
- Griglia polizze del cliente raggruppate (riusa PolicyCard).

## FormMandateWefox

Form solo-frontend (submit → log + schermata successo, come il sorgente), label hardcoded in tedesco, liste statiche di 36 assicurazioni e ~56 consulenti Wefox, drag&drop per Mandat/Ausweis.
