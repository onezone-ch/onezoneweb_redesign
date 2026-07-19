# Sezione Polizze, Offerte, Consulente, Sinistri

Componenti condivisi della sezione: [src/features/policies/PolicyCard.tsx](../src/features/policies/PolicyCard.tsx) (card griglia con logo assicurazione) e [src/features/policies/insuranceAvatar.ts](../src/features/policies/insuranceAvatar.ts) (avatar Blob→dataURL).

| Pagina | Rotta | Feature component | Note |
|---|---|---|---|
| Polizze | `/policies`, `/policies/:clientid` | [PoliciesPage.tsx](../src/features/policies/PoliciesPage.tsx) | `policyList` (con `contact` se clientid), raggruppate per cliente, avatar async, bottone aggiungi solo vista personale, empty state |
| Dettaglio polizza | `/policy/:policyid` | [PolicyPage.tsx](../src/features/policies/PolicyPage.tsx) | `policy` + `premiumInvoice` (ultima fattura per endDate); azioni: copia polizza (→`/file/:docid` se `policyDocument`), segnala sinistro, contatta consulente |
| Aggiungi polizza | `/policyadd` | [PolicyAddPage.tsx](../src/features/policies/PolicyAddPage.tsx) | lista `insurance()` con checkbox; se l'utente HA già mandato firmato (`getDocumentCategoryItemInfo` con file.id) → `mandateInformInsurances` diretto; altrimenti salva `selectedPolicies` → `/agreement` |
| Seleziona polizza | `/policy-select` | [PolicySelectPage.tsx](../src/features/policies/PolicySelectPage.tsx) | griglia → `/report/:id` |
| Comparatori | `/compare` | [ComparePage.tsx](../src/features/policies/ComparePage.tsx) | 8 categorie → link esterni `statics.LinkOneZoneCompare*` con `%CID%` = `contact.uniqueId`. NOTA: `compare.rent` e `compare.animal` mancano nei JSON i18n (bug ereditato dal sorgente) |
| Sinistro | `/report/:policyid` | [ReportPage.tsx](../src/features/policies/ReportPage.tsx) | data + descrizione + galleria foto add/remove → `createClaim` + `uploadFile` + `claimInformInsurances` → home |
| Offerte | `/offer`, `/offer/:offerid` | [OffersPage.tsx](../src/features/offers/OffersPage.tsx) | `tender` + `tenderOffer` per ciascuno; tab Segmented con conteggi (filtro su `isAccepted` null/true/false); accetta/rifiuta con reload; download allegato → `/file/:id`; preselezione da `:offerid` (tab + tender aperto) |
| Consulente | `/consultant`, `/consultant/:policyid` | [ConsultantPage.tsx](../src/features/offers/ConsultantPage.tsx) | card `userData.pointOfContact` con mailto:/tel:. (La chat non esiste più, rimossa anche nel sorgente) |
| Firma mandato | `/agreement` | [AgreementPage.tsx](../src/features/offers/AgreementPage.tsx) | testi + checkbox "mantieni consulente" + assicuratori da `selectedPolicies` + **canvas firma** (mouse+touch, check canvas vuoto) → `createSignetJasperreport(Brokermandat{,EN,IT,FR})` + `mandateInformInsurances(isNew=!keepConsultant)`; download documento → `/jasper/...`; condizioni → `statics.LinkOneZoneAGB` |
