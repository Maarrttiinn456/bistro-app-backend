# Bistro API — endpoint katalog

Pracovní seznam backend endpointů, které bude mobilní aplikace Bistro potřebovat.
Slouží jako kontext pro routy (Fastify), Zod response schémata a OpenAPI/Orval generování.

## Předpoklady

- API prefix: `/v1`
- Formát odpovědí: JSON
- Chráněné endpointy používají `Authorization: Bearer <access_token>`
- Mobilní aplikace nikdy nevolá Supabase přímo
- Supabase Auth, Storage a Postgres obaluje Fastify backend

## System

| Endpoint | Popis odpovědi |
|---|---|
| `GET /health` | Vrací stav API, timestamp a volitelně stav připojení k databázi. |
| `GET /openapi.json` | Vrací OpenAPI specifikaci pro Orval codegen v Expo aplikaci. |
| `GET /docs` | Vrací Swagger UI pro vývoj a kontrolu API. |

## Auth

| Endpoint | Popis odpovědi |
|---|---|
| `POST /auth/signup` | Vrací nového uživatele, access token, refresh token, profil a automaticky vytvořenou domácnost. |
| `POST /auth/login` | Vrací access token, refresh token, profil a aktivní domácnost. |
| `POST /auth/refresh` | Vrací nový access token a refresh token podle refresh tokenu. |
| `POST /auth/logout` | Vrací potvrzení odhlášení, typicky `{ success: true }`. |
| `GET /auth/me` | Vrací aktuálního uživatele, profil, cíle, aktivní domácnost a členství v domácnostech. |
| `POST /auth/password-reset` | Vrací potvrzení, že byl zahájen reset hesla přes Supabase. |
| `POST /auth/password-update` | Vrací potvrzení změny hesla po reset/deep link flow. |

## Profil

| Endpoint | Popis odpovědi |
|---|---|
| `GET /profile/me` | Vrací profil uživatele: jméno, email, avatar, AI poznámky, kalorické cíle a makro cíle. |
| `PATCH /profile/me` | Vrací upravený profil včetně nových cílů nebo aktivní domácnosti. |

## Domácnosti

| Endpoint | Popis odpovědi |
|---|---|
| `GET /households` | Vrací domácnosti, ve kterých je uživatel členem, včetně role a aktivní domácnosti. |
| `POST /households` | Vrací nově vytvořenou domácnost a členství aktuálního uživatele jako `owner`. |
| `GET /households/:householdId` | Vrací detail domácnosti, členy, role a základní metadata. |
| `PATCH /households/:householdId` | Vrací upravenou domácnost, typicky po změně názvu. |
| `POST /households/:householdId/activate` | Vrací profil s nově nastaveným `active_household_id`. |
| `POST /households/:householdId/invites` | Vrací invite token nebo link, expiraci a domácnost, do které pozvánka vede. |
| `POST /household-invites/:token/accept` | Vrací nové členství, aktivovanou domácnost a její detail. |
| `DELETE /households/:householdId/members/:userId` | Vrací potvrzení odebrání člena nebo opuštění domácnosti. |

## Suroviny

| Endpoint | Popis odpovědi |
|---|---|
| `GET /ingredients?query=&scope=` | Vrací suroviny z globální databáze a aktivní domácnosti včetně maker na 100 g/ml. |
| `POST /ingredients` | Vrací novou domácnostní surovinu. |
| `GET /ingredients/:ingredientId` | Vrací detail suroviny včetně značky, EAN, serving info a maker. |
| `PATCH /ingredients/:ingredientId` | Vrací upravenou surovinu. |
| `DELETE /ingredients/:ingredientId` | Vrací potvrzení smazání domácnostní suroviny. |
| `POST /ingredients/barcode/resolve` | Vrací surovinu podle EAN; pokud není lokálně, může ji načíst z externí databáze a vrátit `created` nebo `source`. |

## Recepty

| Endpoint | Popis odpovědi |
|---|---|
| `GET /recipes?query=&mealType=` | Vrací recepty aktivní domácnosti s makro souhrnem na porci. |
| `POST /recipes` | Vrací nový recept včetně surovin a vypočtených maker. |
| `GET /recipes/:recipeId` | Vrací detail receptu, suroviny, postup, fotku a makra z `recipe_macros`. |
| `PATCH /recipes/:recipeId` | Vrací upravený recept včetně aktuálních surovin a maker. |
| `DELETE /recipes/:recipeId` | Vrací potvrzení smazání receptu. |
| `POST /recipes/import-url/preview` | Vrací návrh receptu z URL (název, porce, postup, suroviny, možné matchnutí na `ingredients`); nic neukládá. |

## Plán jídel

| Endpoint | Popis odpovědi |
|---|---|
| `GET /meal-plan?from=&to=` | Vrací dny se sloty uživatele, recipe summary, osobní suroviny slotu a makra slotu. |
| `POST /meal-plan/slots` | Vrací nový slot (z receptu se zkopírovanými surovinami, nebo ručně vytvořený). |
| `GET /meal-plan/slots/:slotId` | Vrací detail slotu, osobní gramáže, makra, recipe reference a stav snědení. |
| `PATCH /meal-plan/slots/:slotId` | Vrací upravený slot: datum, meal slot, porce, recipe reference nebo `eaten_at`. |
| `DELETE /meal-plan/slots/:slotId` | Vrací potvrzení smazání slotu i jeho osobních surovin. |
| `PUT /meal-plan/slots/:slotId/ingredients` | Vrací uložený seznam osobních surovin slotu a nově přepočtená makra. |
| `POST /meal-plan/slots/:slotId/eat` | Vrací nový `food_log` snapshot ze slotu a aktualizovaný slot s `eaten_at`. |
| `POST /meal-plan/slots/:slotId/uneat` | Vrací slot bez `eaten_at`; volitelně informaci, jestli byl odstraněn navázaný log. |
| `POST /meal-plan/generate-preview` | Vrací AI návrh plánu pro období a členy (sloty, recepty, gramáže, makra); nic neukládá. |
| `POST /meal-plan/apply-preview` | Vrací vytvořené/nahrazené sloty a jejich suroviny pro vybrané členy domácnosti. |

## Food log

| Endpoint | Popis odpovědi |
|---|---|
| `GET /food-log?from=&to=` | Vrací logy za období, denní součty a základní cíle pro porovnání. |
| `POST /food-log` | Vrací nový záznam ze zdroje `manual`, `search`, `barcode` nebo `ai`, včetně snapshot maker. |
| `GET /food-log/:logId` | Vrací detail logu včetně source, snapshotů a vazeb na recept, surovinu nebo slot. |
| `PATCH /food-log/:logId` | Vrací upravený log a přepočtené denní součty. |
| `DELETE /food-log/:logId` | Vrací potvrzení smazání a nové denní součty. |
| `POST /food-log/ai-estimate` | Vrací AI odhad jídla z textu (název, množství, kalorie, makra, confidence); nic neukládá. |

## Přehledy

| Endpoint | Popis odpovědi |
|---|---|
| `GET /dashboard/today?date=` | Vrací vše pro obrazovku Dnes: plán, logy, denní součty, cíle a progress procenta. |
| `GET /stats/daily?from=&to=` | Vrací agregaci z `daily_intake`: kcal, protein, carbs, fat a počet záznamů po dnech. |
| `GET /stats/summary?from=&to=` | Vrací souhrn za období: průměry, celky, nejlepší/nejhorší dny a plnění cílů. |

## Nákupní seznamy

| Endpoint | Popis odpovědi |
|---|---|
| `POST /shopping-lists/preview` | Vrací agregovaný návrh položek z plánů za období; nic neukládá. |
| `GET /shopping-lists` | Vrací uložené nákupní seznamy uživatele. |
| `POST /shopping-lists` | Vrací nový uložený seznam s položkami. |
| `GET /shopping-lists/:listId` | Vrací detail seznamu, položky, checked stav a období. |
| `PATCH /shopping-lists/:listId` | Vrací upravený název nebo období seznamu. |
| `DELETE /shopping-lists/:listId` | Vrací potvrzení smazání seznamu. |
| `POST /shopping-lists/:listId/items` | Vrací novou položku seznamu. |
| `PATCH /shopping-list-items/:itemId` | Vrací upravenou položku: název, množství, kategorii, pořadí nebo `checked`. |
| `DELETE /shopping-list-items/:itemId` | Vrací potvrzení smazání položky. |

## Uploady

| Endpoint | Popis odpovědi |
|---|---|
| `POST /uploads/sign` | Vrací signed upload URL, storage path, HTTP method a expiraci pro přímý upload do Supabase Storage. |
| `POST /uploads/sign-read` | Vrací signed read URL pro jeden nebo více storage path (např. fotky receptů nebo jídel). |
| `DELETE /uploads` | Vrací potvrzení smazání objektu ze Storage podle path, pokud ho už nic nepoužívá. |

## Doporučené MVP pořadí implementace

1. System: `/health`, `/openapi.json`, `/docs`
2. Auth: signup, login, refresh, logout, me
3. Profil a domácnosti bez invite flow
4. Suroviny
5. Recepty
6. Plán jídel
7. Food log
8. Dashboard today a denní statistiky
9. Uploady pro fotky
10. Invite flow, AI plán a nákupní seznamy

## Otevřené rozhodnutí

Před detailní implementací autorizace je potřeba vyřešit rozpor z projektového kontextu:

- `CONTEXT.md` zachycuje pravidlo z Notionu, že autorizace má být v aplikační vrstvě a RLS vypnuté.
- Notion migrace zároveň obsahovala RLS policies.

Bez tohoto rozhodnutí by routy mohly vzniknout nad dvěma různými bezpečnostními modely.

