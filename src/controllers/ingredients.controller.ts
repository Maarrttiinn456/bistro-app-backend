import { and, asc, eq, ilike, isNull, or } from 'drizzle-orm'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { db } from '../db/client'
import { ingredients, profiles } from '../db/schema'
import type { GetIngredientsQuery } from '../schemas/ingredients.schema'

// Prevadi Drizzle numeric hodnotu z DB na number pro JSON odpoved.
const toNumber = (value: string | number | null) => {
  if (value === null) {
    return null
  }

  return Number(value)
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

// Najde aktivni domacnost prihlaseneho uzivatele podle request.user.id.
const getActiveHouseholdId = async (userId: string) => {
  const [profile] = await db
    .select({ activeHouseholdId: profiles.activeHouseholdId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)

  return profile?.activeHouseholdId ?? null
}

// Vraci chybu, kdyz uzivatel nema nastavenou aktivni domacnost.
const sendMissingHousehold = async (reply: FastifyReply) => reply.code(400).send({
  error: 'Active household is missing',
})

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
