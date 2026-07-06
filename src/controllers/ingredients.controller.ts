import { and, asc, eq, ilike, isNull, or } from 'drizzle-orm'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { db } from '../db/client'
import { ingredients } from '../db/schema'
import { getActiveHouseholdId } from '../lib/access'
import { toNumber } from '../lib/nutrition'
import type { CreateIngredientBody, GetIngredientsQuery } from '../schemas/ingredients.schema'

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
