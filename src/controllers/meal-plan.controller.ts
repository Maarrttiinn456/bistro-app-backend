import { and, asc, eq, gte, inArray, lte } from 'drizzle-orm'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { db } from '../db/client'
import {
  ingredients,
  mealPlanSlotIngredients,
  mealPlanSlots,
  profiles,
  recipeIngredients,
  recipes,
} from '../db/schema'
import type {
  CreateMealPlanSlotBody,
  GetMealPlanQuery,
  MealPlanSlotParams,
  UpdateMealPlanSlotBody,
  UpdateMealPlanSlotIngredientsBody,
} from '../schemas/meal-plan.schema'

type SlotIngredientInput = NonNullable<CreateMealPlanSlotBody['ingredients']>[number]
type MealPlanSlotIngredient = typeof mealPlanSlotIngredients.$inferSelect
type Ingredient = typeof ingredients.$inferSelect
type Recipe = typeof recipes.$inferSelect

// Prevadi Drizzle numeric hodnotu z DB na number pro JSON odpoved.
const toNumber = (value: string | number | null) => {
  if (value === null) {
    return null
  }

  return Number(value)
}

// Docasna prazdna makra pro detail slotu, kdyz chybi napojena surovina.
const emptyMacros = {
  kcal: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
}

// Pripocita makra jedne suroviny do celkovych maker slotu.
const addMacroTotals = (total: typeof emptyMacros, slotIngredient: MealPlanSlotIngredient, ingredient?: Ingredient) => {
  if (!ingredient) {
    return total
  }

  const amountRatio = Number(slotIngredient.amountG) / 100

  return {
    kcal: total.kcal + Number(ingredient.kcalPer100) * amountRatio,
    protein: total.protein + Number(ingredient.proteinPer100) * amountRatio,
    carbs: total.carbs + Number(ingredient.carbsPer100) * amountRatio,
    fat: total.fat + Number(ingredient.fatPer100) * amountRatio,
  }
}

// Upravuje surovinu slotu z DB do tvaru, ktery vraci API.
const normalizeSlotIngredient = (slotIngredient: MealPlanSlotIngredient) => ({
  ...slotIngredient,
  amountG: Number(slotIngredient.amountG),
  displayAmount: toNumber(slotIngredient.displayAmount),
})

// Vraci z receptu jen zakladni data potrebna v detailu slotu.
const normalizeRecipeSummary = (recipe: Recipe | null) => recipe
  ? {
    id: recipe.id,
    name: recipe.name,
    image: recipe.image,
    portions: recipe.portions,
    mealTypes: recipe.mealTypes,
  }
  : null

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

// Vraci chybu, kdyz slot neexistuje nebo nepatri prihlasenemu uzivateli.
const sendSlotNotFound = async (reply: FastifyReply) => reply.code(404).send({
  error: 'Meal plan slot not found',
})

// Vraci chybu, kdyz recept neexistuje nebo nepatri do aktivni domacnosti.
const sendRecipeNotFound = async (reply: FastifyReply) => reply.code(404).send({
  error: 'Recipe not found',
})

// Najde recept dostupny v aktivni domacnosti prihlaseneho uzivatele.
const getAccessibleRecipe = async (recipeId: string, householdId: string) => {
  const [recipe] = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.id, recipeId), eq(recipes.householdId, householdId)))
    .limit(1)

  return recipe ?? null
}

// Nacte recept prirazeny ke slotu, pokud slot nejaky recept ma.
const getSlotRecipe = async (recipeId: string | null) => {
  if (!recipeId) {
    return null
  }

  const [recipe] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, recipeId))
    .limit(1)

  return recipe ?? null
}

// Prevadi surovinu z request body na insert tvar pro tabulku meal_plan_slot_ingredients.
const mapIngredientInput = (slotId: string, ingredient: SlotIngredientInput, index: number) => ({
  slotId,
  ingredientId: ingredient.ingredientId ?? null,
  displayName: ingredient.displayName,
  amountG: ingredient.amountG.toString(),
  displayAmount: ingredient.displayAmount?.toString() ?? null,
  displayUnit: ingredient.displayUnit ?? null,
  position: ingredient.position ?? index,
})

// Kopiruje surovinu receptu do osobniho slotu a prepocita ji na jednu porci.
const mapRecipeIngredientToSlot = (
  slotId: string,
  recipeIngredient: typeof recipeIngredients.$inferSelect,
  recipePortions: number,
  index: number,
) => ({
  slotId,
  ingredientId: recipeIngredient.ingredientId,
  displayName: recipeIngredient.displayName,
  amountG: (Number(recipeIngredient.amountG) / recipePortions).toString(),
  displayAmount: recipeIngredient.displayAmount,
  displayUnit: recipeIngredient.displayUnit,
  position: recipeIngredient.position ?? index,
})

// Nacte detail slotu prihlaseneho uzivatele vcetne surovin, receptu a maker.
const getSlotDetail = async (slotId: string, userId: string) => {
  const [slot] = await db
    .select()
    .from(mealPlanSlots)
    .where(and(eq(mealPlanSlots.id, slotId), eq(mealPlanSlots.userId, userId)))
    .limit(1)

  if (!slot) {
    return null
  }

  const slotIngredients = await db
    .select()
    .from(mealPlanSlotIngredients)
    .where(eq(mealPlanSlotIngredients.slotId, slot.id))
    .orderBy(asc(mealPlanSlotIngredients.position), asc(mealPlanSlotIngredients.createdAt))

  const ingredientIds = slotIngredients
    .map((slotIngredient) => slotIngredient.ingredientId)
    .filter((ingredientId): ingredientId is string => Boolean(ingredientId))

  const ingredientRows = ingredientIds.length
    ? await db.select().from(ingredients).where(inArray(ingredients.id, ingredientIds))
    : []

  const ingredientById = new Map(ingredientRows.map((ingredient) => [ingredient.id, ingredient]))
  const macrosTotal = slotIngredients.reduce(
    (total, slotIngredient) => addMacroTotals(
      total,
      slotIngredient,
      slotIngredient.ingredientId ? ingredientById.get(slotIngredient.ingredientId) : undefined,
    ),
    emptyMacros,
  )

  return {
    slot: {
      ...slot,
      recipe: normalizeRecipeSummary(await getSlotRecipe(slot.recipeId)),
      ingredients: slotIngredients.map(normalizeSlotIngredient),
      macrosTotal,
    },
  }
}

// Vytvori seznam dat mezi zacatkem a koncem vcetne obou hranic.
const getDateRange = (from: string, to: string) => {
  const dates: string[] = []
  const current = new Date(`${from}T00:00:00.000Z`)
  const last = new Date(`${to}T00:00:00.000Z`)

  while (current <= last) {
    dates.push(current.toISOString().slice(0, 10))
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return dates
}

/*
 * GET /meal-plan
 * Vraci plan jidla prihlaseneho uzivatele za obdobi.
 */
export const getMealPlan = async (
  request: FastifyRequest<{ Querystring: GetMealPlanQuery }>,
  reply: FastifyReply,
) => {
  const query = request.query

  if (query.from > query.to) {
    return reply.code(400).send({ error: 'Invalid date range' })
  }

  const slotRows = await db
    .select()
    .from(mealPlanSlots)
    .where(and(
      eq(mealPlanSlots.userId, request.user.id),
      gte(mealPlanSlots.dayDate, query.from),
      lte(mealPlanSlots.dayDate, query.to),
    ))
    .orderBy(asc(mealPlanSlots.dayDate), asc(mealPlanSlots.slot), asc(mealPlanSlots.createdAt))

  const slotDetails = await Promise.all(slotRows.map((slot) => getSlotDetail(slot.id, request.user.id)))
  const slotsByDate = new Map<string, NonNullable<Awaited<ReturnType<typeof getSlotDetail>>>['slot'][]>()

  for (const detail of slotDetails) {
    if (!detail) {
      continue
    }

    const daySlots = slotsByDate.get(detail.slot.dayDate) ?? []
    daySlots.push(detail.slot)
    slotsByDate.set(detail.slot.dayDate, daySlots)
  }

  return {
    days: getDateRange(query.from, query.to).map((date) => ({
      date,
      slots: slotsByDate.get(date) ?? [],
    })),
  }
}

/*
 * POST /meal-plan/slots
 * Vytvori slot planu jidla pro prihlaseneho uzivatele.
 */
export const createMealPlanSlot = async (
  request: FastifyRequest<{ Body: CreateMealPlanSlotBody }>,
  reply: FastifyReply,
) => {
  const body = request.body
  const activeHouseholdId = body.recipeId ? await getActiveHouseholdId(request.user.id) : null

  if (body.recipeId && !activeHouseholdId) {
    await sendMissingHousehold(reply)
    return
  }

  const recipe = body.recipeId ? await getAccessibleRecipe(body.recipeId, activeHouseholdId as string) : null

  if (body.recipeId && !recipe) {
    await sendRecipeNotFound(reply)
    return
  }

  const [slot] = await db
    .insert(mealPlanSlots)
    .values({
      userId: request.user.id,
      dayDate: body.dayDate,
      slot: body.slot,
      recipeId: body.recipeId ?? null,
    })
    .returning()

  if (body.ingredients?.length) {
    await db
      .insert(mealPlanSlotIngredients)
      .values(body.ingredients.map((ingredient, index) => mapIngredientInput(slot.id, ingredient, index)))
  } else if (recipe) {
    const recipeIngredientRows = await db
      .select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, recipe.id))
      .orderBy(asc(recipeIngredients.position), asc(recipeIngredients.createdAt))

    if (recipeIngredientRows.length) {
      await db
        .insert(mealPlanSlotIngredients)
        .values(recipeIngredientRows.map((ingredient, index) => (
          mapRecipeIngredientToSlot(slot.id, ingredient, recipe.portions, index)
        )))
    }
  }

  const detail = await getSlotDetail(slot.id, request.user.id)

  return reply.code(201).send(detail)
}

/*
 * GET /meal-plan/slots/:slotId
 * Vraci detail slotu planu jidla.
 */
export const getMealPlanSlot = async (
  request: FastifyRequest<{ Params: MealPlanSlotParams }>,
  reply: FastifyReply,
) => {
  const detail = await getSlotDetail(request.params.slotId, request.user.id)

  if (!detail) {
    await sendSlotNotFound(reply)
    return
  }

  return detail
}

/*
 * PATCH /meal-plan/slots/:slotId
 * Upravi datum, typ jidla, recept nebo stav snedeni slotu.
 */
export const updateMealPlanSlot = async (
  request: FastifyRequest<{ Params: MealPlanSlotParams, Body: UpdateMealPlanSlotBody }>,
  reply: FastifyReply,
) => {
  const body = request.body

  if (body.recipeId) {
    const activeHouseholdId = await getActiveHouseholdId(request.user.id)

    if (!activeHouseholdId) {
      await sendMissingHousehold(reply)
      return
    }

    const recipe = await getAccessibleRecipe(body.recipeId, activeHouseholdId)

    if (!recipe) {
      await sendRecipeNotFound(reply)
      return
    }
  }

  const [updatedSlot] = await db
    .update(mealPlanSlots)
    .set({
      ...(body.dayDate !== undefined ? { dayDate: body.dayDate } : {}),
      ...(body.slot !== undefined ? { slot: body.slot } : {}),
      ...(body.recipeId !== undefined ? { recipeId: body.recipeId } : {}),
      ...(body.eatenAt !== undefined ? { eatenAt: body.eatenAt ? new Date(body.eatenAt) : null } : {}),
    })
    .where(and(eq(mealPlanSlots.id, request.params.slotId), eq(mealPlanSlots.userId, request.user.id)))
    .returning({ id: mealPlanSlots.id })

  if (!updatedSlot) {
    await sendSlotNotFound(reply)
    return
  }

  return getSlotDetail(updatedSlot.id, request.user.id)
}

/*
 * DELETE /meal-plan/slots/:slotId
 * Smaze slot planu jidla prihlaseneho uzivatele.
 */
export const deleteMealPlanSlot = async (
  request: FastifyRequest<{ Params: MealPlanSlotParams }>,
  reply: FastifyReply,
) => {
  const [deletedSlot] = await db
    .delete(mealPlanSlots)
    .where(and(eq(mealPlanSlots.id, request.params.slotId), eq(mealPlanSlots.userId, request.user.id)))
    .returning({ id: mealPlanSlots.id })

  if (!deletedSlot) {
    await sendSlotNotFound(reply)
    return
  }

  return reply.send({ success: true })
}

/*
 * PUT /meal-plan/slots/:slotId/ingredients
 * Nahradi osobni suroviny slotu planu jidla.
 */
export const updateMealPlanSlotIngredients = async (
  request: FastifyRequest<{ Params: MealPlanSlotParams, Body: UpdateMealPlanSlotIngredientsBody }>,
  reply: FastifyReply,
) => {
  const [slot] = await db
    .select({ id: mealPlanSlots.id })
    .from(mealPlanSlots)
    .where(and(eq(mealPlanSlots.id, request.params.slotId), eq(mealPlanSlots.userId, request.user.id)))
    .limit(1)

  if (!slot) {
    await sendSlotNotFound(reply)
    return
  }

  await db.delete(mealPlanSlotIngredients).where(eq(mealPlanSlotIngredients.slotId, slot.id))

  if (request.body.ingredients.length) {
    await db
      .insert(mealPlanSlotIngredients)
      .values(request.body.ingredients.map((ingredient, index) => mapIngredientInput(slot.id, ingredient, index)))
  }

  return getSlotDetail(slot.id, request.user.id)
}
