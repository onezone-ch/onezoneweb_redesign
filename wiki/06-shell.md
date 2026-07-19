# Sezione Shell (home, menu, profilo)

## Home — `/home`

[src/features/shell/HomePage.tsx](../src/features/shell/HomePage.tsx) · rotta [src/app/(authed)/home/page.tsx](../src/app/%28authed%29/home/page.tsx)

- **Carousel banner** WordPress (cache-first localStorage `bannerData`, card flottanti 325×200 con overlay).
- **Saluto** Display 32 (`index.welcome` + `getUserName()`).
- **Bottone consulente "Genera Preventivi"** (solo `isTrue(userData.login?.isSharer)`): verify-login cache-first (`consultantLoginCheck`), altrimenti `checkLogin` con timeout 90s → `/automation-form` o `/automation-setup`; timeout → toast di errore. ("Invia mandato" è nascosto, parità col sorgente.)
- **Menu dinamico** da `customerportalmenu(3)` per consulenti / `(1)` per clienti; voci con `name`/`url` per lingua, navigazione via `navigateTo` (gestisce link esterni e `app://`).
- **Cache consulente**: al mount, se consulente, `getConsultant(id)` cache-first (`consultantData`) → salva `consultantApiKey` + `consultantDisabledScrapers`.
- **Citazione** random da `quotation()` (cache `quotations`).

## Menu — `/menu`

[src/features/shell/MenuPage.tsx](../src/features/shell/MenuPage.tsx) · rotta [src/app/(authed)/menu/page.tsx](../src/app/%28authed%29/menu/page.tsx)

Indice sezioni da `customerportalmenu(2)`. In fondo: "Gestione consulenti" (solo admin `isAdmin`), **Logout** (danger; svuota tutto lo storage), link sito OneZone (`statics.LinkOneZoneWebsite`). L'header authed mostra ✕ su questa rotta (`inMenu` in navigation.ts).

## Profilo — `/profile`

[src/features/shell/ProfilePage.tsx](../src/features/shell/ProfilePage.tsx) · rotta [src/app/(authed)/profile/page.tsx](../src/app/%28authed%29/profile/page.tsx)

- **Carousel contatti** (`contactContactList` con `filters[show_contacts]=1`, utente auth in testa, avatar Blob→dataURL) + "+ aggiungi profilo" → `/link/:id`.
- **Sezioni collassabili**: Dati personali; Indirizzo (edit inline → `changeContact`); Dati di accesso (email/mobile/password — cambio email o password fa **logout**, parità); Documenti (lazy `contactFiles`, upload immagine `uploadProfileFile`, apri → `/file/:id`).
- Dati statici (link supporto/FAQ/comparatori): [src/data/statics.json](../src/data/statics.json).
