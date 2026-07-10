import { and, asc, eq, ilike, isNull, or } from 'drizzle-orm'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { db } from '../db/client'
import { ingredients } from '../db/schema'
import { getActiveHouseholdId } from '../lib/access'
import { toNumber } from '../lib/nutrition'
import type {
  CreateIngredientBody,
  GetIngredientsQuery,
  IngredientParams,
  ResolveIngredientBarcodeBody,
  UpdateIngredientBody,
} from '../schemas/ingredients.schema'

const OPEN_FOOD_FACTS_FIELDS = [
  'code',
  'product_name',
  'brands',
  'nutriments',
  'nutrition_data_per',
  'serving_size',
  'serving_quantity',
]

type OpenFoodFactsProduct = {
  product_name?: unknown
  brands?: unknown
  nutriments?: Record<string, unknown>
  nutrition_data_per?: unknown
  serving_size?: unknown
  serving_quantity?: unknown
}

type OpenFoodFactsResponse = {
  status?: unknown
  result?: {
    id?: unknown
  }
  product?: OpenFoodFactsProduct
}

type IngredientInsertInput = {
  name: string
  brand: string | null
  barcode: string
  baseUnit: 'g' | 'ml'
  kcalPer100: number
  proteinPer100: number
  carbsPer100: number
  fatPer100: number
  servingGrams: number | null
  servingLabel: string | null
}

// Upravuje surovinu z DB do tvaru, ktery vraci API.
const normalizeIngredient = (ingredient: typeof ingredients.$inferSelect) => ({
  ...ingredient,
  kcalPer100: Number(ingredient.kcalPer100),
  proteinPer100: Number(ingredient.proteinPer100),
  carbsPer100: Number(ingredient.carbsPer100),
  fatPer100: Number(ingredient.fatPer100),
  servingGrams: toNumber(ingredient.servingGrams),
})

// Vraci chybu, kdyz uzivatel nema nastavenou aktivni domacnost.
const sendMissingHousehold = async (reply: FastifyReply) => reply.code(400).send({
  error: 'Active household is missing',
})

// Vraci orezany string, pokud externi API poslalo pouzitelnou textovou hodnotu.
const getString = (value: unknown) => (
  typeof value === 'string' && value.trim().length ? value.trim() : null
)

// Prevadi ciselnou hodnotu z Open Food Facts na number.
const getNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim().length) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

// Nacte dostupnou surovinu podle barcode z lokalni DB.
const findAccessibleIngredientByBarcode = async (barcode: string, activeHouseholdId: string | null) => {
  const scopeCondition = activeHouseholdId
    ? or(isNull(ingredients.householdId), eq(ingredients.householdId, activeHouseholdId))
    : isNull(ingredients.householdId)

  const [ingredient] = await db
    .select()
    .from(ingredients)
    .where(and(
      eq(ingredients.barcode, barcode),
      scopeCondition,
      isNull(ingredients.archivedAt),
    ))
    .limit(1)

  return ingredient ?? null
}

// Mapuje produkt z Open Food Facts do tvaru pro tabulku ingredients.
const mapOpenFoodFactsProduct = (barcode: string, product: OpenFoodFactsProduct): IngredientInsertInput | null => {
  const name = getString(product.product_name)
  const nutriments = product.nutriments ?? {}
  const kcalPer100 = getNumber(nutriments['energy-kcal_100g'])
  const proteinPer100 = getNumber(nutriments.proteins_100g)
  const carbsPer100 = getNumber(nutriments.carbohydrates_100g)
  const fatPer100 = getNumber(nutriments.fat_100g)

  if (
    !name
    || kcalPer100 === null
    || proteinPer100 === null
    || carbsPer100 === null
    || fatPer100 === null
  ) {
    return null
  }

  const nutritionDataPer = getString(product.nutrition_data_per)

  return {
    name,
    brand: getString(product.brands),
    barcode,
    baseUnit: nutritionDataPer === '100ml' ? 'ml' : 'g',
    kcalPer100,
    proteinPer100,
    carbsPer100,
    fatPer100,
    servingGrams: getNumber(product.serving_quantity),
    servingLabel: getString(product.serving_size),
  }
}

// Nacte produkt z Open Food Facts podle EAN/UPC a vrati insert tvar.
const fetchOpenFoodFactsIngredient = async (barcode: string) => {
  const url = new URL(`https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(barcode)}`)
  url.searchParams.set('fields', OPEN_FOOD_FACTS_FIELDS.join(','))

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'bistro-app-backend/0.1 (barcode resolve)',
    },
  })

  if (response.status === 404) {
    return { found: false, ingredient: null } as const
  }

  if (!response.ok) {
    throw new Error('Open Food Facts request failed')
  }

  const payload = await response.json() as OpenFoodFactsResponse

  if (
    payload.status !== 'success'
    || payload.result?.id !== 'product_found'
    || !payload.product
  ) {
    return { found: false, ingredient: null } as const
  }

  return {
    found: true,
    ingredient: mapOpenFoodFactsProduct(barcode, payload.product),
  } as const
}

/*
 * POST /ingredients
 * Vytvori domacnostni surovinu v aktivni domacnosti uzivatele.
 */
export const createIngredient = async (
  request: FastifyRequest<{ Body: CreateIngredientBody }>,
  reply: FastifyReply,
) => {
  const activeHouseholdId = await getActiveHouseholdId(request.user.id)

  if (!activeHouseholdId) {
    await sendMissingHousehold(reply)
    return
  }

  const body = request.body
  const [ingredient] = await db
    .insert(ingredients)
    .values({
      householdId: activeHouseholdId,
      name: body.name,
      brand: body.brand ?? null,
      barcode: body.barcode ?? null,
      baseUnit: body.baseUnit ?? 'g',
      kcalPer100: body.kcalPer100.toString(),
      proteinPer100: body.proteinPer100.toString(),
      carbsPer100: body.carbsPer100.toString(),
      fatPer100: body.fatPer100.toString(),
      servingGrams: body.servingGrams?.toString() ?? null,
      servingLabel: body.servingLabel ?? null,
    })
    .returning()

  return reply.code(201).send({
    ingredient: normalizeIngredient(ingredient),
  })
}

/*
 * GET /ingredients/:ingredientId
 * Vraci detail globalni suroviny nebo suroviny aktivni domacnosti uzivatele.
 */
export const getIngredient = async (
  request: FastifyRequest<{ Params: IngredientParams }>,
  reply: FastifyReply,
) => {
  const activeHouseholdId = await getActiveHouseholdId(request.user.id)
  const scopeCondition = activeHouseholdId
    ? or(isNull(ingredients.householdId), eq(ingredients.householdId, activeHouseholdId))
    : isNull(ingredients.householdId)

  const [ingredient] = await db
    .select()
    .from(ingredients)
    .where(and(
      eq(ingredients.id, request.params.ingredientId),
      scopeCondition,
      isNull(ingredients.archivedAt),
    ))
    .limit(1)

  if (!ingredient) {
    return reply.code(404).send({ error: 'Ingredient not found' })
  }

  return {
    ingredient: normalizeIngredient(ingredient),
  }
}

/*
 * PATCH /ingredients/:ingredientId
 * Upravi domacnostni surovinu v aktivni domacnosti uzivatele.
 */
export const updateIngredient = async (
  request: FastifyRequest<{ Params: IngredientParams, Body: UpdateIngredientBody }>,
  reply: FastifyReply,
) => {
  const activeHouseholdId = await getActiveHouseholdId(request.user.id)

  if (!activeHouseholdId) {
    await sendMissingHousehold(reply)
    return
  }

  const body = request.body
  const [ingredient] = await db
    .update(ingredients)
    .set({
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.brand !== undefined ? { brand: body.brand } : {}),
      ...(body.barcode !== undefined ? { barcode: body.barcode } : {}),
      ...(body.baseUnit !== undefined ? { baseUnit: body.baseUnit } : {}),
      ...(body.kcalPer100 !== undefined ? { kcalPer100: body.kcalPer100.toString() } : {}),
      ...(body.proteinPer100 !== undefined ? { proteinPer100: body.proteinPer100.toString() } : {}),
      ...(body.carbsPer100 !== undefined ? { carbsPer100: body.carbsPer100.toString() } : {}),
      ...(body.fatPer100 !== undefined ? { fatPer100: body.fatPer100.toString() } : {}),
      ...(body.servingGrams !== undefined ? { servingGrams: body.servingGrams?.toString() ?? null } : {}),
      ...(body.servingLabel !== undefined ? { servingLabel: body.servingLabel } : {}),
    })
    .where(and(
      eq(ingredients.id, request.params.ingredientId),
      eq(ingredients.householdId, activeHouseholdId),
      isNull(ingredients.archivedAt),
    ))
    .returning()

  if (!ingredient) {
    return reply.code(404).send({ error: 'Ingredient not found' })
  }

  return {
    ingredient: normalizeIngredient(ingredient),
  }
}

/*
 * PATCH /ingredients/:ingredientId/archive
 * Archivuje surovinu z aktivni domacnosti uzivatele.
 */
export const archiveIngredient = async (
  request: FastifyRequest<{ Params: IngredientParams }>,
  reply: FastifyReply,
) => {
  const activeHouseholdId = await getActiveHouseholdId(request.user.id)

  if (!activeHouseholdId) {
    await sendMissingHousehold(reply)
    return
  }

  const [ingredient] = await db
    .update(ingredients)
    .set({ archivedAt: new Date() })
    .where(and(
      eq(ingredients.id, request.params.ingredientId),
      eq(ingredients.householdId, activeHouseholdId),
      isNull(ingredients.archivedAt),
    ))
    .returning()

  if (!ingredient) {
    return reply.code(404).send({ error: 'Ingredient not found' })
  }

  return {
    ingredient: normalizeIngredient(ingredient),
  }
}

/*
 * POST /ingredients/barcode/resolve
 * Najde nebo importuje globalni surovinu podle EAN/UPC barcode.
 */
export const resolveIngredientBarcode = async (
  request: FastifyRequest<{ Body: ResolveIngredientBarcodeBody }>,
  reply: FastifyReply,
) => {
  const barcode = request.body.barcode.trim()
  const activeHouseholdId = await getActiveHouseholdId(request.user.id)

  if (!barcode.length) {
    return reply.code(400).send({ error: 'Barcode is required' })
  }

  const localIngredient = await findAccessibleIngredientByBarcode(barcode, activeHouseholdId)

  if (localIngredient) {
    return {
      ingredient: normalizeIngredient(localIngredient),
      source: 'local',
      created: false,
    }
  }

  let externalIngredient: Awaited<ReturnType<typeof fetchOpenFoodFactsIngredient>>

  try {
    externalIngredient = await fetchOpenFoodFactsIngredient(barcode)
  } catch {
    return reply.code(502).send({ error: 'Product lookup failed' })
  }

  if (!externalIngredient.found) {
    return reply.code(404).send({ error: 'Product not found' })
  }

  if (!externalIngredient.ingredient) {
    return reply.code(422).send({ error: 'Product nutrition data is incomplete' })
  }

  const [createdIngredient] = await db
    .insert(ingredients)
    .values({
      householdId: null,
      name: externalIngredient.ingredient.name,
      brand: externalIngredient.ingredient.brand,
      barcode: externalIngredient.ingredient.barcode,
      baseUnit: externalIngredient.ingredient.baseUnit,
      kcalPer100: externalIngredient.ingredient.kcalPer100.toString(),
      proteinPer100: externalIngredient.ingredient.proteinPer100.toString(),
      carbsPer100: externalIngredient.ingredient.carbsPer100.toString(),
      fatPer100: externalIngredient.ingredient.fatPer100.toString(),
      servingGrams: externalIngredient.ingredient.servingGrams?.toString() ?? null,
      servingLabel: externalIngredient.ingredient.servingLabel,
    })
    .onConflictDoNothing({ target: ingredients.barcode })
    .returning()

  if (createdIngredient) {
    return {
      ingredient: normalizeIngredient(createdIngredient),
      source: 'open_food_facts',
      created: true,
    }
  }

  const importedIngredient = await findAccessibleIngredientByBarcode(barcode, activeHouseholdId)

  if (!importedIngredient) {
    return reply.code(502).send({ error: 'Product lookup failed' })
  }

  return {
    ingredient: normalizeIngredient(importedIngredient),
    source: 'local',
    created: false,
  }
}

/*
 * GET /ingredients
 * Vraci globalni suroviny a suroviny aktivni domacnosti.
 */
export const getIngredients = async (
  request: FastifyRequest<{ Querystring: GetIngredientsQuery }>,
  reply: FastifyReply,
) => {
  const query = request.query
  const scope = query.scope ?? 'all'
  const activeHouseholdId = await getActiveHouseholdId(request.user.id)

  if (scope === 'household' && !activeHouseholdId) {
    await sendMissingHousehold(reply)
    return
  }

  const scopeCondition = scope === 'global'
    ? isNull(ingredients.householdId)
    : scope === 'household'
      ? eq(ingredients.householdId, activeHouseholdId as string)
      : activeHouseholdId
        ? or(isNull(ingredients.householdId), eq(ingredients.householdId, activeHouseholdId))
        : isNull(ingredients.householdId)

  const conditions = [
    scopeCondition,
    isNull(ingredients.archivedAt),
    ...(query.query ? [ilike(ingredients.name, `%${query.query}%`)] : []),
  ]

  const ingredientRows = await db
    .select()
    .from(ingredients)
    .where(and(...conditions))
    .orderBy(asc(ingredients.name))

  return {
    ingredients: ingredientRows.map(normalizeIngredient),
  }
}
