import { and, asc, eq, gte, inArray, isNull, lt, or } from 'drizzle-orm'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { db } from '../db/client'
import { foodLog, ingredients, mealPlanSlots, profiles, recipes } from '../db/schema'
import type {
  CreateFoodLogBody,
  FoodLogParams,
  GetFoodLogQuery,
  UpdateFoodLogBody,
} from '../schemas/food-log.schema'

type FoodLogRow = typeof foodLog.$inferSelect
type FoodLogMutationBody = CreateFoodLogBody | UpdateFoodLogBody

const emptyTotals = {
  kcal: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
}

// Prevadi Drizzle numeric hodnotu z DB na number pro JSON odpoved.
const toNumber = (value: string | number | null) => {
  if (value === null) {
    return null
  }

  return Number(value)
}

// Upravuje food log z DB do tvaru, ktery vraci API.
const normalizeFoodLog = (log: FoodLogRow) => ({
  ...log,
  kcalSnapshot: Number(log.kcalSnapshot),
  proteinSnapshot: Number(log.proteinSnapshot),
  carbsSnapshot: Number(log.carbsSnapshot),
  fatSnapshot: Number(log.fatSnapshot),
  quantityG: toNumber(log.quantityG),
  portions: toNumber(log.portions),
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

// Nacte denni makro cile prihlaseneho uzivatele.
const getUserGoals = async (userId: string) => {
  const [profile] = await db
    .select({
      goalKcal: profiles.goalKcal,
      goalProtein: profiles.goalProtein,
      goalCarbs: profiles.goalCarbs,
      goalFat: profiles.goalFat,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)

  return profile
    ? {
      kcal: profile.goalKcal,
      protein: profile.goalProtein,
      carbs: profile.goalCarbs,
      fat: profile.goalFat,
    }
    : null
}

// Vraci chybu, kdyz food log neexistuje nebo nepatri prihlasenemu uzivateli.
const sendLogNotFound = async (reply: FastifyReply) => reply.code(404).send({
  error: 'Food log not found',
})

// Vraci chybu, kdyz profil prihlaseneho uzivatele neexistuje.
const sendProfileNotFound = async (reply: FastifyReply) => reply.code(404).send({
  error: 'Profile not found',
})

// Vraci chybu, kdyz odkazovana entita neexistuje nebo neni dostupna.
const sendReferenceNotFound = async (reply: FastifyReply) => reply.code(404).send({
  error: 'Referenced entity not found',
})

// Vytvori zacatek rozsahu pro datum ve food log query.
const getStartDate = (date: string) => new Date(`${date}T00:00:00.000Z`)

// Vytvori exkluzivni konec rozsahu pro datum ve food log query.
const getExclusiveEndDate = (date: string) => {
  const endDate = getStartDate(date)
  endDate.setUTCDate(endDate.getUTCDate() + 1)

  return endDate
}

// Vrati YYYY-MM-DD klic pro seskupeni logu podle dne.
const getLogDate = (eatenAt: Date) => eatenAt.toISOString().slice(0, 10)

// Sestavi prazdny denni soucet pro konkretni datum.
const createEmptyDailyTotal = (date: string) => ({
  date,
  totals: { ...emptyTotals },
  count: 0,
})

// Secte makra logu do denniho souctu.
const addLogToDailyTotal = (dailyTotal: ReturnType<typeof createEmptyDailyTotal>, log: FoodLogRow) => ({
  date: dailyTotal.date,
  totals: {
    kcal: dailyTotal.totals.kcal + Number(log.kcalSnapshot),
    protein: dailyTotal.totals.protein + Number(log.proteinSnapshot),
    carbs: dailyTotal.totals.carbs + Number(log.carbsSnapshot),
    fat: dailyTotal.totals.fat + Number(log.fatSnapshot),
  },
  count: dailyTotal.count + 1,
})

// Spocita denni soucty z logu pro response.
const getDailyTotals = (logs: FoodLogRow[]) => {
  const totalsByDate = new Map<string, ReturnType<typeof createEmptyDailyTotal>>()

  for (const log of logs) {
    const date = getLogDate(log.eatenAt)
    const currentTotal = totalsByDate.get(date) ?? createEmptyDailyTotal(date)
    totalsByDate.set(date, addLogToDailyTotal(currentTotal, log))
  }

  return [...totalsByDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}

// Spocita denni soucet prihlaseneho uzivatele pro jeden den.
const getDailyTotal = async (userId: string, date: string) => {
  const logs = await db
    .select()
    .from(foodLog)
    .where(and(
      eq(foodLog.userId, userId),
      gte(foodLog.eatenAt, getStartDate(date)),
      lt(foodLog.eatenAt, getExclusiveEndDate(date)),
    ))

  return getDailyTotals(logs)[0] ?? createEmptyDailyTotal(date)
}

// Overi, ze odkazovana surovina je globalni nebo patri do aktivni domacnosti.
const validateIngredientReference = async (ingredientId: string | null | undefined, userId: string) => {
  if (ingredientId === undefined || ingredientId === null) {
    return true
  }

  const activeHouseholdId = await getActiveHouseholdId(userId)
  const [ingredient] = await db
    .select({ id: ingredients.id })
    .from(ingredients)
    .where(and(
      eq(ingredients.id, ingredientId),
      activeHouseholdId
        ? or(isNull(ingredients.householdId), eq(ingredients.householdId, activeHouseholdId))
        : isNull(ingredients.householdId),
    ))
    .limit(1)

  return Boolean(ingredient)
}

// Overi, ze odkazovany recept patri do aktivni domacnosti uzivatele.
const validateRecipeReference = async (recipeId: string | null | undefined, userId: string) => {
  if (recipeId === undefined || recipeId === null) {
    return true
  }

  const activeHouseholdId = await getActiveHouseholdId(userId)

  if (!activeHouseholdId) {
    return false
  }

  const [recipe] = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(and(eq(recipes.id, recipeId), eq(recipes.householdId, activeHouseholdId)))
    .limit(1)

  return Boolean(recipe)
}

// Overi, ze odkazovany slot planu patri prihlasenemu uzivateli.
const validatePlanSlotReference = async (planSlotId: string | null | undefined, userId: string) => {
  if (planSlotId === undefined || planSlotId === null) {
    return true
  }

  const [slot] = await db
    .select({ id: mealPlanSlots.id })
    .from(mealPlanSlots)
    .where(and(eq(mealPlanSlots.id, planSlotId), eq(mealPlanSlots.userId, userId)))
    .limit(1)

  return Boolean(slot)
}

// Overi vsechny volitelne vazby food logu.
const validateReferences = async (body: FoodLogMutationBody, userId: string) => {
  const [ingredientValid, recipeValid, planSlotValid] = await Promise.all([
    validateIngredientReference(body.ingredientId, userId),
    validateRecipeReference(body.recipeId, userId),
    validatePlanSlotReference(body.planSlotId, userId),
  ])

  return ingredientValid && recipeValid && planSlotValid
}

// Prevadi request body na insert tvar pro tabulku food_log.
const mapCreateBody = (body: CreateFoodLogBody, userId: string) => ({
  userId,
  eatenAt: new Date(body.eatenAt),
  nameSnapshot: body.nameSnapshot,
  kcalSnapshot: body.kcalSnapshot.toString(),
  proteinSnapshot: body.proteinSnapshot.toString(),
  carbsSnapshot: body.carbsSnapshot.toString(),
  fatSnapshot: body.fatSnapshot.toString(),
  quantityG: body.quantityG?.toString() ?? null,
  portions: body.portions?.toString() ?? null,
  source: body.source,
  recipeId: body.recipeId ?? null,
  ingredientId: body.ingredientId ?? null,
  planSlotId: body.planSlotId ?? null,
})

// Prevadi request body na update tvar pro tabulku food_log.
const mapUpdateBody = (body: UpdateFoodLogBody) => ({
  ...(body.eatenAt !== undefined ? { eatenAt: new Date(body.eatenAt) } : {}),
  ...(body.nameSnapshot !== undefined ? { nameSnapshot: body.nameSnapshot } : {}),
  ...(body.kcalSnapshot !== undefined ? { kcalSnapshot: body.kcalSnapshot.toString() } : {}),
  ...(body.proteinSnapshot !== undefined ? { proteinSnapshot: body.proteinSnapshot.toString() } : {}),
  ...(body.carbsSnapshot !== undefined ? { carbsSnapshot: body.carbsSnapshot.toString() } : {}),
  ...(body.fatSnapshot !== undefined ? { fatSnapshot: body.fatSnapshot.toString() } : {}),
  ...(body.quantityG !== undefined ? { quantityG: body.quantityG?.toString() ?? null } : {}),
  ...(body.portions !== undefined ? { portions: body.portions?.toString() ?? null } : {}),
  ...(body.source !== undefined ? { source: body.source } : {}),
  ...(body.recipeId !== undefined ? { recipeId: body.recipeId } : {}),
  ...(body.ingredientId !== undefined ? { ingredientId: body.ingredientId } : {}),
  ...(body.planSlotId !== undefined ? { planSlotId: body.planSlotId } : {}),
})

/*
 * GET /food-log
 * Vraci food logy prihlaseneho uzivatele za obdobi vcetne dennich souctu a cilu.
 */
export const getFoodLog = async (
  request: FastifyRequest<{ Querystring: GetFoodLogQuery }>,
  reply: FastifyReply,
) => {
  const query = request.query

  if (query.from > query.to) {
    return reply.code(400).send({ error: 'Invalid date range' })
  }

  const goals = await getUserGoals(request.user.id)

  if (!goals) {
    await sendProfileNotFound(reply)
    return
  }

  const logs = await db
    .select()
    .from(foodLog)
    .where(and(
      eq(foodLog.userId, request.user.id),
      gte(foodLog.eatenAt, getStartDate(query.from)),
      lt(foodLog.eatenAt, getExclusiveEndDate(query.to)),
    ))
    .orderBy(asc(foodLog.eatenAt), asc(foodLog.createdAt))

  return {
    logs: logs.map(normalizeFoodLog),
    dailyTotals: getDailyTotals(logs),
    goals,
  }
}

/*
 * POST /food-log
 * Vytvori food log snapshot pro prihlaseneho uzivatele.
 */
export const createFoodLog = async (
  request: FastifyRequest<{ Body: CreateFoodLogBody }>,
  reply: FastifyReply,
) => {
  const referencesValid = await validateReferences(request.body, request.user.id)

  if (!referencesValid) {
    await sendReferenceNotFound(reply)
    return
  }

  const [log] = await db
    .insert(foodLog)
    .values(mapCreateBody(request.body, request.user.id))
    .returning()

  return reply.code(201).send({ log: normalizeFoodLog(log) })
}

/*
 * GET /food-log/:logId
 * Vraci detail food logu prihlaseneho uzivatele.
 */
export const getFoodLogDetail = async (
  request: FastifyRequest<{ Params: FoodLogParams }>,
  reply: FastifyReply,
) => {
  const [log] = await db
    .select()
    .from(foodLog)
    .where(and(eq(foodLog.id, request.params.logId), eq(foodLog.userId, request.user.id)))
    .limit(1)

  if (!log) {
    await sendLogNotFound(reply)
    return
  }

  return { log: normalizeFoodLog(log) }
}

/*
 * PATCH /food-log/:logId
 * Upravi food log snapshot a vrati prepocitany denni soucet.
 */
export const updateFoodLog = async (
  request: FastifyRequest<{ Params: FoodLogParams, Body: UpdateFoodLogBody }>,
  reply: FastifyReply,
) => {
  const referencesValid = await validateReferences(request.body, request.user.id)

  if (!referencesValid) {
    await sendReferenceNotFound(reply)
    return
  }

  const updateData = mapUpdateBody(request.body)

  if (Object.keys(updateData).length === 0) {
    return getFoodLogDetail(request, reply)
  }

  const [log] = await db
    .update(foodLog)
    .set(updateData)
    .where(and(eq(foodLog.id, request.params.logId), eq(foodLog.userId, request.user.id)))
    .returning()

  if (!log) {
    await sendLogNotFound(reply)
    return
  }

  return {
    log: normalizeFoodLog(log),
    dailyTotal: await getDailyTotal(request.user.id, getLogDate(log.eatenAt)),
  }
}

/*
 * DELETE /food-log/:logId
 * Smaze food log prihlaseneho uzivatele a vrati prepocitany denni soucet.
 */
export const deleteFoodLog = async (
  request: FastifyRequest<{ Params: FoodLogParams }>,
  reply: FastifyReply,
) => {
  const [deletedLog] = await db
    .delete(foodLog)
    .where(and(eq(foodLog.id, request.params.logId), eq(foodLog.userId, request.user.id)))
    .returning()

  if (!deletedLog) {
    await sendLogNotFound(reply)
    return
  }

  return {
    success: true,
    dailyTotal: await getDailyTotal(request.user.id, getLogDate(deletedLog.eatenAt)),
  }
}
