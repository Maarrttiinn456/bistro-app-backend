# Architecture rules

1. **Supabase pouze server-side** — nikdy nevolej Supabase klienta přímo z routy. Vždy přes `plugins/supabase.ts` dekorovaný na `fastify.supabase`.

2. **RLS vypnuto — autorizace v queries** — každý Drizzle query musí filtrovat podle `request.user.id` ve `WHERE`. Nespoléhej na RLS v Supabase.

3. **Drizzle schema je jediný zdroj pravdy** — žádné ruční SQL tabulky, žádné `supabase gen types`. Typy se odvozují přes `$inferSelect` / `$inferInsert`.

4. **Zod schémata přes drizzle-zod** — nepiš Zod schémata ručně pro DB entity. Používej `createInsertSchema` / `createSelectSchema` z `drizzle-zod`.

5. **Auth je proxy, ne vlastní logika** — backend nikdy negeneruje JWT. Pouze forwarduje na Supabase Auth a ověřuje příchozí tokeny přes `jose` v preHandler middleware. Frontend nikdy nevolá Supabase přímo — vše jde přes Fastify.

6. **Makra se počítají v TypeScriptu** — žádné DB views. Drizzle JOIN + aritmetika v route handlerech. Platí pro `recipe_macros`, `slot_macros` i `daily_intake` (statistiky po dnech).

7. **Upload fotek receptů** — `POST /uploads/recipe-image` endpoint, Supabase Storage. URL se uloží do `recipes.image`. Při AI importu z URL se ukládá externí URL as-is.

8. **AI plánování** — Claude API (Anthropic). Backend načte recepty domácnosti + cíle maker členů, pošle prompt se structured outputem, zapíše výsledek rovnou do DB. Přeplánování = DELETE starých slotů + INSERT nových v jedné transakci.
