# Bistro app — backend

Node.js + Fastify + Drizzle ORM + Supabase Postgres + Zod + TypeScript.

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
```

## Feature docs

Před prací na konkrétní feature si přečti příslušný soubor v `.agents/docs/`.
Např. pro auth endpointy: `.agents/docs/feature-auth-endpoints.md`.
Soubory se nenačítají automaticky — vyžádej si ten relevantní.

## .agents složka

```
.agents/
├── docs/      # feature-specific dokumenty (jeden soubor = jedna feature)
└── rules/
    ├── architecture.md   # architektonická pravidla (načteno automaticky)
    └── data-structure.md # tabulky, relace, datové toky (načteno automaticky)
```
