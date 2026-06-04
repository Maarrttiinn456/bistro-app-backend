# Bistro app — backend

Node.js + Fastify + Drizzle ORM + Supabase Postgres + Zod + TypeScript.

## Pracovni pravidla

- Delej pouze to, co uzivatel explicitne zadal.
- Nikdy nepridavej, neupravuj ani nevylepsuj dalsi veci jen proto, ze davaji smysl.
- Nikdy neupravuj soubory, casti kodu ani chovani mimo explicitni zadani uzivatele.
- Pokud by bylo vhodne udelat neco navic, nejdriv se zeptej a cekej na potvrzeni.
- Pokud si nejsi jisty, co ma byt spravne reseni, zeptej se uzivatele pred upravou kodu.
- Drz reseni co nejjednodussi a nepridavej abstrakce, dokud nejsou opravdu potreba.

## Komentare v kodu

- Pokud je funkce endpoint/controller handler, dej nad ni viditelny blokovy komentar ve formatu `/* ... */`.
- Endpoint komentar ma obsahovat HTTP metodu, cestu a kratce co endpoint dela.
- Bezne helper funkce komentuj jen kratkym `//` komentarem, pokud neni jejich ucel okamzite zrejmy.

## Architektonická pravidla

@.agents/rules/architecture.md

## Datová struktura

@.agents/rules/data-structure.md

## Struktura projektu

```
src/
├── db/
│   ├── schema.ts        # Drizzle tabulky (zdroj pravdy)
│   ├── client.ts        # postgres-js + drizzle instance
│   └── relations.ts
├── schemas/             # Zod schémata přes drizzle-zod
├── routes/              # Fastify route registrace (URL, schema, preHandler, odkaz na controller)
├── controllers/         # Handler funkce — business logika, Drizzle queries
├── plugins/             # JWT preHandler, Supabase klient, Swagger, CORS
├── lib/                 # helpers (signed URL atd.)
└── server.ts            # app bootstrap

migrations/              # SQL migrace generované Drizzle Kitem
```

## Dev příkazy

```bash
pnpm dev          # spustí dev server (tsx watch)
pnpm build        # kompilace TS
pnpm start        # produkční spuštění

pnpm db:generate  # drizzle-kit generate (vytvoří SQL migraci)
pnpm db:migrate   # drizzle-kit migrate (aplikuje na DB)
pnpm db:studio    # Drizzle Studio (lokální DB prohlížeč)
pnpm db:seed      # idempotentni demo seed (2 uzivatele, 1 domacnost, recepty)
```

## Feature docs

Před prací na konkrétní feature si přečti příslušný soubor v `.agents/docs/`.
Soubory se nenačítají automaticky — vyžádej si ten relevantní.

## Endpoint katalog (požadavky mobilní appky)

@.agents/docs/endpoints.md

## .agents složka

```
.agents/
├── docs/      # feature-specific dokumenty (jeden soubor = jedna feature)
└── rules/
    ├── architecture.md   # architektonická pravidla (načteno automaticky)
    └── data-structure.md # tabulky, relace, datové toky (načteno automaticky)
```

