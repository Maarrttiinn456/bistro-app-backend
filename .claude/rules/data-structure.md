# Datová struktura — Bistro app

Zdroj pravdy pro AI při generování Drizzle schématu, rout a business logiky.

---

## Čtyři vrstvy modelu

```
ingredients          = co existuje (potraviny, makra na 100 g)
recipes              = co bych mohl uvařit (šablona, sdílená domácností)
meal_plan_slots      = co budu vařit (osobní instance s konkrétními gramážemi)
food_log             = co jsem reálně snědl (zmrazená historie)
```

Sdílené vs osobní:
```
SDÍLENÉ (domácnost):  recipes, ingredients
OSOBNÍ (na uživatele): meal_plan_slots, slot_ingredients, food_log, profiles (cíle)
```

---

## Tabulky

### `households`
Skupina lidí sdílející recepty. Vrchol pyramidy.

| sloupec | typ | poznámka |
|---|---|---|
| id | uuid PK | |
| name | text | |
| created_by | uuid FK → profiles | |
| created_at | timestamptz | defaultNow() |

### `profiles`
Uživatel (1:1 s `auth.users`). Osobní cíle maker a aktivní domácnost.

| sloupec | typ | poznámka |
|---|---|---|
| id | uuid PK | = auth.users.id |
| name | text | |
| email | text | |
| avatar_url | text | nullable |
| ai_notes | text | nullable |
| goal_kcal | int | |
| goal_protein | int | |
| goal_carbs | int | |
| goal_fat | int | |
| active_household_id | uuid FK → households | nullable |
| created_at | timestamptz | defaultNow() |

### `household_members`
Many-to-many: kdo je v jaké domácnosti a v jaké roli.

| sloupec | typ | poznámka |
|---|---|---|
| household_id | uuid PK FK → households | |
| user_id | uuid PK FK → profiles | |
| role | text | `owner` nebo `member` |
| joined_at | timestamptz | defaultNow() |

**Proč:** jeden člověk může být ve víc domácnostech, jedna domácnost má víc lidí.

### `ingredients`
Surovina s makry na 100 g. Globální nebo domácnostní.

| sloupec | typ | poznámka |
|---|---|---|
| id | uuid PK | |
| household_id | uuid FK → households | NULL = globální (seed/EAN), vidí všichni |
| name | text | |
| brand | text | nullable |
| barcode | text | nullable, unique (EAN) |
| base_unit | text | `g` nebo `ml` |
| kcal_per_100 | numeric | |
| protein_per_100 | numeric | |
| carbs_per_100 | numeric | |
| fat_per_100 | numeric | |
| serving_grams | numeric | nullable — 1 ks = X g |
| serving_label | text | nullable — např. `1 sušenka` |
| created_at | timestamptz | defaultNow() |

**Proč `household_id = NULL`:** globální suroviny (seed data, EAN import) sdílí všechny domácnosti. Domácnostní surovina patří jen své domácnosti.

### `recipes`
Recept patří domácnosti (sdílený). Je to šablona, ne instance.

| sloupec | typ | poznámka |
|---|---|---|
| id | uuid PK | |
| household_id | uuid FK → households | sdílený celou domácností |
| created_by | uuid FK → profiles | nullable, jen informativní |
| name | text | |
| image | text | URL |
| prep_time_min | int | |
| portions | int | na kolik porcí je recept |
| meal_types | meal_slot[] | enum array |
| steps | text | |
| source_url | text | nullable — URL import |
| created_at | timestamptz | defaultNow() |

### `recipe_ingredients`
Suroviny receptu. `amount_g` je na **celý recept** (všechny porce dohromady).

| sloupec | typ | poznámka |
|---|---|---|
| id | uuid PK | |
| recipe_id | uuid FK → recipes | |
| ingredient_id | uuid FK → ingredients | nullable — volný text bez makro napojení |
| display_name | text | co se zobrazí uživateli |
| amount_g | numeric | na celý recept |
| display_amount | numeric | nullable — např. 3 |
| display_unit | text | nullable — např. `ks`, `lžíce` |
| position | int | pořadí v receptu |
| created_at | timestamptz | defaultNow() |

**Proč `ingredient_id` nullable:** surovina může být zadána jako volný text (AI import). Bez odkazu ale nejsou makra.

### `meal_plan_slots`
Osobní plán: „v pondělí na oběd mám tohle". Patří uživateli, ne domácnosti.

| sloupec | typ | poznámka |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → profiles | osobní! |
| day_date | date | |
| slot | meal_slot | enum: `breakfast`, `lunch`, `dinner`, `snack` |
| recipe_id | uuid FK → recipes | nullable — odkaz odkud vzniklo, jen informativní |
| eaten_at | timestamptz | nullable — kdy bylo snědeno |
| created_at | timestamptz | defaultNow() |

### `meal_plan_slot_ingredients`
Skutečné gramáže pro daný slot — **kopie** z receptu, upravitelná osobně.

| sloupec | typ | poznámka |
|---|---|---|
| id | uuid PK | |
| slot_id | uuid FK → meal_plan_slots | |
| ingredient_id | uuid FK → ingredients | nullable |
| display_name | text | |
| amount_g | numeric | MOJE gramáž (ne z receptu) |
| display_amount | numeric | |
| display_unit | text | |
| position | int | |
| created_at | timestamptz | defaultNow() |

**Proč kopie a ne odkaz na `recipe_ingredients`:** recept je sdílená šablona. Uživatel si chce měnit gramáže jen pro sebe, aniž by rozbil recept pro zbytek domácnosti. „Plán je skutečnost, recept je inspirace."

### `food_log`
Deník co bylo reálně snědeno. Makra jsou zmrazená v momentě snězení.

| sloupec | typ | poznámka |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → profiles | |
| eaten_at | timestamptz | |
| name_snapshot | text | zmrazené jméno |
| kcal_snapshot | numeric | zmrazené totaly — už spočítané |
| protein_snapshot | numeric | |
| carbs_snapshot | numeric | |
| fat_snapshot | numeric | |
| quantity_g | numeric | nullable |
| portions | numeric | nullable |
| source | food_log_source | enum: `plan`, `manual`, `barcode`, `ai`, `search` |
| recipe_id | uuid FK → recipes | nullable |
| ingredient_id | uuid FK → ingredients | nullable |
| plan_slot_id | uuid FK → meal_plan_slots | nullable |
| created_at | timestamptz | defaultNow() |

**Proč snapshot:** kdyby se recept nebo surovina změnily, historická data musí zůstat pravdivá. Deník je „co se stalo" — to se zpětně nemění.

**Která FK jsou vyplněna podle `source`:**
- `plan` → `plan_slot_id` + `recipe_id`
- `barcode` / `search` → `ingredient_id`
- `ai` → `ingredient_id` (nullable, nebo jen snapshot)
- `manual` → nic

### `shopping_lists`
Nákupní seznam za období. Patří uživateli.

| sloupec | typ | poznámka |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → profiles | |
| name | text | |
| date_from | date | |
| date_to | date | |
| created_at | timestamptz | defaultNow() |

### `shopping_list_items`
Položky na seznamu.

| sloupec | typ | poznámka |
|---|---|---|
| id | uuid PK | |
| shopping_list_id | uuid FK → shopping_lists | |
| category | text | |
| ingredient_id | uuid FK → ingredients | nullable — volná položka nemá odkaz |
| display_name | text | |
| amount | text | |
| checked | boolean | odškrtnuto při nákupu |
| position | int | |
| created_at | timestamptz | defaultNow() |

---

## Enums

```
meal_slot:       breakfast | lunch | dinner | snack
food_log_source: plan | manual | barcode | ai | search
```

---

## Kde žijí makra

Makra jsou uložena **jen v `ingredients`** (na 100 g). Nikde jinde se neukládají — všechno ostatní si je dopočítá z gramáže, nebo zmrazí jako snapshot do `food_log`.

Výpočet pro recept: `amount_g / 100 × ingredient.kcal_per_100` pro každou surovinu, pak součet.

Výpočet pro slot: stejně, ale z `meal_plan_slot_ingredients.amount_g`.

---

## Datové toky

### Registrace
Trigger `on_auth_user_created` → automaticky vytvoří:
1. `profiles` (id = auth.users.id)
2. `households` (vlastní domácnost)
3. `household_members` (role = owner)
4. Update `profiles.active_household_id`

I sólo uživatel dostane vlastní domácnost — model je konzistentní a pozdější přidání člena nevyžaduje migraci.

### Vytvoření receptu
Uloží se `recipes` (hlavička) + N řádků `recipe_ingredients`. Makra se nikam neukládají — počítají se za běhu z `ingredients`.

### AI plánování
`POST /plan/generate` — zapíše rovnou do DB:
1. DELETE existujících slotů pro dané dny a uživatele (v transakci)
2. Pro každého člena domácnosti a každý slot:
   - Vytvoří `meal_plan_slots` (osobní, `user_id` = konkrétní uživatel)
   - Zkopíruje `recipe_ingredients` → `meal_plan_slot_ingredients`, naškálované na počet porcí

Každý člen dostane vlastní nezávislou kopii. `recipe_id` na slotu zůstává jen jako vizuální reference (název, fotka). Uživatel může plán smazat nebo přeplánovat — volání endpointu znovu přepíše existující sloty.

### Snědení z plánu
1. Spočítá makra z `meal_plan_slot_ingredients` × `ingredients`
2. Zapíše `food_log` se zmrazenými snapshoty a `source = plan`
3. Update `meal_plan_slots.eaten_at`

### Ad-hoc jídlo (barcode / AI / search)
1. Najde nebo vytvoří `ingredients`
2. Zapíše `food_log` se snapshoty a příslušným `source`
3. `plan_slot_id` zůstává NULL

### Nákupní seznam
Agregace `meal_plan_slot_ingredients` pro dané období → sečte stejné suroviny → uloží `shopping_lists` + `shopping_list_items`.

### Statistiky (přehled)
Čtení `food_log` po dnech (view `daily_intake`), filtr na `user_id`. Plán se ignoruje — přehled zobrazuje realitu, ne záměr.

---

## Klíčová designová rozhodnutí

1. **Makra jen v `ingredients`** — jedno místo pravdy, vše ostatní počítá nebo zmrazuje.
2. **Recept je šablona, slot je instance** — kopírování surovin do slotu odděluje osobní gramáže od sdíleného receptu.
3. **Snapshoty v `food_log`** — historie je imutabilní, změna receptu/suroviny ji neovlivní.
4. **RLS je vypnuto** — autorizace se řeší WHERE filtrem na `user_id` / `household_id` v každém Drizzle query.
5. **Nákupní seznam je zatím osobní** — vědomě odložené rozhodnutí, MVP agreguje jen z plánu jednoho uživatele.
