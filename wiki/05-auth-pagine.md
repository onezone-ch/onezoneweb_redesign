# Sezione Auth (login, recover, register, lingua)

## Login — `/login`

[src/features/auth/LoginPage.tsx](../src/features/auth/LoginPage.tsx) · rotta [src/app/(unauthed)/login/page.tsx](../src/app/%28unauthed%29/login/page.tsx)

Email/password, banner errore cliccabile (`login.LOGIN_STATUS_FAILED`), link recover e registrazione (codice consulente fisso `0852221850d5638e4c80b9da870f942b`, parità col sorgente). Login ok → `startSession` → `/home`.

## Recover — `/recover`

[src/features/auth/RecoverPage.tsx](../src/features/auth/RecoverPage.tsx) · rotta [src/app/(unauthed)/recover/page.tsx](../src/app/%28unauthed%29/recover/page.tsx)

Doppia modalità in una pagina: senza codice → `resetPassword` (email col codice); con codice → `confirmResetPassword` (nuova password). Toast di conferma.

## Register — `/register`, `/register/:consultantCode`, `/link/:contactid`

[src/features/auth/RegisterPage.tsx](../src/features/auth/RegisterPage.tsx) · rotte [src/app/(unauthed)/register/[[...consultantCode]]/page.tsx](../src/app/%28unauthed%29/register/%5B%5B...consultantCode%5D%5D/page.tsx) e [src/app/(authed)/link/[contactid]/page.tsx](../src/app/%28authed%29/link/%5Bcontactid%5D/page.tsx)

- Segmented Persona/Azienda; persona: gender radio + nome/cognome/nascita; azienda: Ragione Sociale → `name1`, `name2=""`.
- Indirizzo CH con autocomplete condiviso (vedi [02-design-system.md](02-design-system.md) → `useAddressAutocomplete`); n. civico concatenato in `address`.
- Validazione client (port di checkData: required/invalid con CAP/città/via validati dalle API) + violations backend mappate per `propertyPath`.
- Payload: `contactType` 1=azienda/2=persona, `contactGroup '3'`, `country 1`, `language` numerico, `invitationCode` dal path.
- Modalità normale: `registerUser` → login automatico → `/policyadd`. Modalità link (da profilo): campo relazione, `addSubcontact`, back().

## Lingua — `/language` (authed), `/language_unauthed`

[src/features/auth/LanguagePage.tsx](../src/features/auth/LanguagePage.tsx) · rotte [src/app/(authed)/language/page.tsx](../src/app/%28authed%29/language/page.tsx), [src/app/(unauthed)/language_unauthed/page.tsx](../src/app/%28unauthed%29/language_unauthed/page.tsx)

Componente unico: dropdown con le altre 3 lingue; `setLang` (context re-render); da loggati salva anche `language` (id numerico) sul contatto BrokerStar.
