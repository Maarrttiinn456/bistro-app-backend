# Technicke rozhodnuti: API kontrakt a frontend typy

## Rozhodnuti

Backend pouziva nativni Fastify JSON Schema pro route kontrakty a `@fastify/swagger` pro generovani OpenAPI.

Frontend je samostatny git projekt. Typovany API klient se bude generovat ve frontend repu z OpenAPI vystupu backendu pomoci Orval.

## Proc

- Fastify JSON Schema je nativni validacni format Fastify.
- OpenAPI je stabilni kontrakt mezi oddelenym backend a frontend repozitarem.
- Orval umi z OpenAPI generovat TypeScript typy a React Query klienta pro React Native frontend.
- Zod neni nutny pro generovani frontend typu, protoze Orval potrebuje OpenAPI, ne Zod schema.

## Flow

```text
Fastify route schema
  -> @fastify/swagger
  -> OpenAPI JSON
  -> Orval ve frontend repu
  -> typovany React Query API klient
```

## Pravidla pro backend routy

- Kazda verejna API route ma mit Fastify `schema`.
- `GET` endpointy bez vstupu nemaji `body`; pouzivaji hlavne `response`, pozdeji pripadne `querystring` a `params`.
- `POST`/`PUT`/`PATCH` endpointy popisuji `body`.
- `/:id` endpointy popisuji `params`.
- Response schema popisuje HTTP JSON tvar, ne interni TypeScript/DB tvar.
- Datumy v response kontraktu popisuj jako `string` s `format: date-time`.
- Kazda route ma mit stabilni `operationId`, aby Orval generoval stabilni nazvy funkci.

## Role Swaggeru

`@fastify/swagger` se nepouziva primarne kvuli UI dokumentaci. Hlavni role je vygenerovat OpenAPI JSON pro Orval.

Swagger UI je bonus pro lokalni prohlizeni a testovani endpointu.

Lokalni URL:

- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON pro Orval: `http://localhost:3000/docs/json`
- OpenAPI YAML: `http://localhost:3000/docs/yaml`

## Zod

Zod se ted nepouziva jako standard pro route validaci.

Pokud pozdeji zacne byt JSON Schema prilis ukecane pro slozite vstupy, muze se rozhodnuti znovu otevrit. Do te doby je zdroj pravdy pro HTTP API kontrakt Fastify JSON Schema.
