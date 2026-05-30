# Bistro app — backend

Node.js + Fastify + Drizzle ORM + Supabase Postgres + Zod + TypeScript.

## Architektonická pravidla

@.claude/rules/architecture.md

## Datová struktura

@.claude/rules/data-structure.md

## Struktura projektu

```
src/
├── db/
│   ├── schema.ts        # Drizzle tabulky (zdroj pravdy)
│   ├── client.ts        # postgres-js + drizzle instance
│   └── relations.ts
├── schemas/             # Zod schémata přes drizzle-zod
├── routes/              # Fastify routy (auth, meals, uploads, health)
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

Před prací na konkrétní feature si přečti příslušný soubor v `.claude/docs/`.
Např. pro auth endpointy: `.claude/docs/feature-auth-endpoints.md`.
Soubory se nenačítají automaticky — vyžádej si ten relevantní.

## .claude složka

```
.claude/
├── docs/      # feature-specific dokumenty (jeden soubor = jedna feature)
└── rules/
    ├── architecture.md   # architektonická pravidla (načteno automaticky)
    └── data-structure.md # tabulky, relace, datové toky (načteno automaticky)
```
