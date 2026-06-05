import { and, asc, eq, gte, inArray, lt, lte } from 'drizzle-orm'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { db } from '../db/client'
import {
  foodLog,
  ingredients,
  mealPlanSlotIngredients,
  mealPlanSlots,
  profiles,
  recipes,
} from '../db/schema'
import { getDateRange, getExclusiveEndDate, getStartDate } from '../lib/date-range'
import { addMacroTotals, emptyMacros, toNumber } from '../lib/nutrition'
import type { DashboardTodayQuery, StatsRangeQuery } from '../schemas/overview.schema'

type FoodLogRow = typeof foodLog.$inferSelect
type MealPlanSlotRow = typeof mealPlanSlots.$inferSelect
type MealPlanSlotIngredient = typeof mealPlanSlotIngredients.$inferSelect
type Ingredient = typeof ingredients.$inferSelect
type Recipe = typeof recipes.$inferSelect

const roundNumber = (value: number) => Math.round(value * 100) / 100

const normalizeFoodLog = (log: FoodLogRow) => ({
  ...log,
  kcalSnapshot: Number(log.kcalSnapshot),
  proteinSnapshot: Number(log.proteinSnapshot),
  carbsSnapshot: Number(log.carbsSnapshot),
  fatSnapshot: Number(log.fatSnapshot),
  quantityG: toNumber(log.quantityG),
  portions: toNumber(log.portions),
})

const normalizeSlotIngredient = (slotIngredient: MealPlanSlotIngredient) => ({
  ...slotIngredient,
  amountG: Number(slotIngredient.amountG),
  displayAmount: toNumber(slotIngredient.displayAmount),
})

const normalizeRecipeSummary = (recipe: Recipe | null) => recipe
  ? {
    id: recipe.id,
    name: recipe.name,
    image: recipe.image,
    portions: recipe.portions,
    mealTypes: recipe.mealTypes,
  }
  : null

const getLogDate = (eatenAt: Date) => eatenAt.toISOString().slice(0, 10)

const createEmptyDailyTotal = (date: string) => ({
  date,
  totals: { ...emptyMacros },
  count: 0,
})

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

const getDailyTotals = (logs: FoodLogRow[], dates: string[]) => {
  const totalsByDate = new Map(dates.map((date) => [date, createEmptyDailyTotal(date)]))

  for (const log of logs) {
    const date = getLogDate(log.eatenAt)
    const currentTotal = totalsByDate.get(date) ?? createEmptyDailyTotal(date)
    totalsByDate.set(date, addLogToDailyTotal(currentTotal, log))
  }

  return [...totalsByDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}

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

const sendProfileNotFound = async (reply: FastifyReply) => reply.code(404).send({
  error: 'Profile not found',
})

const calculateProgress = (totals: typeof emptyMacros, goals: typeof emptyMacros) => ({
  kcal: goals.kcal > 0 ? roundNumber((totals.kcal / goals.kcal) * 100) : 0,
  protein: goals.protein > 0 ? roundNumber((totals.protein / goals.protein) * 100) : 0,
  carbs: goals.carbs > 0 ? roundNumber((totals.carbs / goals.carbs) * 100) : 0,
  fat: goals.fat > 0 ? roundNumber((totals.fat / goals.fat) * 100) : 0,
})

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

const getSlotDetail = async (slot: MealPlanSlotRow) => {
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
      slotIngredient.amountG,
      slotIngredient.ingredientId ? ingredientById.get(slotIngredient.ingredientId) : undefined,
    ),
    emptyMacros,
  )

  return {
    ...slot,
    recipe: normalizeRecipeSummary(await getSlotRecipe(slot.recipeId)),
    ingredients: slotIngredients.map(normalizeSlotIngredient),
    macrosTotal,
  }
}

const getLogsInRange = async (userId: string, from: string, to: string) => db
  .select()
  .from(foodLog)
  .where(and(
    eq(foodLog.userId, userId),
    gte(foodLog.eatenAt, getStartDate(from)),
    lt(foodLog.eatenAt, getExclusiveEndDate(to)),
  ))
  .orderBy(asc(foodLog.eatenAt), asc(foodLog.createdAt))

const getDailyStats = async (userId: string, from: string, to: string) => {
  const logs = await getLogsInRange(userId, from, to)

  return getDailyTotals(logs, getDateRange(from, to))
}

const sumDailyTotals = (days: Awaited<ReturnType<typeof getDailyStats>>) => days.reduce(
  (totals, day) => ({
    kcal: totals.kcal + day.totals.kcal,
    protein: totals.protein + day.totals.protein,
    carbs: totals.carbs + day.totals.carbs,
    fat: totals.fat + day.totals.fat,
  }),
  { ...emptyMacros },
)

const getAverageTotals = (totals: typeof emptyMacros, daysCount: number) => ({
  kcal: daysCount > 0 ? roundNumber(totals.kcal / daysCount) : 0,
  protein: daysCount > 0 ? roundNumber(totals.protein / daysCount) : 0,
  carbs: daysCount > 0 ? roundNumber(totals.carbs / daysCount) : 0,
  fat: daysCount > 0 ? roundNumber(totals.fat / daysCount) : 0,
})

const getBestDay = (days: Awaited<ReturnType<typeof getDailyStats>>) => {
  const daysWithLogs = days.filter((day) => day.count > 0)

  if (!daysWithLogs.length) {
    return null
  }

  return daysWithLogs.reduce((bestDay, day) => (day.totals.kcal > bestDay.totals.kcal ? day : bestDay))
}

const getWorstDay = (days: Awaited<ReturnType<typeof getDailyStats>>) => {
  const daysWithLogs = days.filter((day) => day.count > 0)

  if (!daysWithLogs.length) {
    return null
  }

  return daysWithLogs.reduce((worstDay, day) => (day.totals.kcal < worstDay.totals.kcal ? day : worstDay))
}

/*
 * GET /dashboard/today
 * Vraci dnesni plan, logy, denni soucty, cile a progress prihlaseneho uzivatele.
 */
export const getDashboardToday = async (
  request: FastifyRequest<{ Querystring: DashboardTodayQuery }>,
  reply: FastifyReply,
) => {
  const { date } = request.query
  const goals = await getUserGoals(request.user.id)

  if (!goals) {
    await sendProfileNotFound(reply)
    return
  }

  const [logs, slots] = await Promise.all([
    getLogsInRange(request.user.id, date, date),
    db
      .select()
      .from(mealPlanSlots)
      .where(and(
        eq(mealPlanSlots.userId, request.user.id),
        eq(mealPlanSlots.dayDate, date),
      ))
      .orderBy(asc(mealPlanSlots.slot), asc(mealPlanSlots.createdAt)),
  ])
  const [dailyTotal] = getDailyTotals(logs, [date])
  const slotDetails = await Promise.all(slots.map(getSlotDetail))

  return {
    date,
    plan: {
      slots: slotDetails,
    },
    logs: logs.map(normalizeFoodLog),
    dailyTotal,
    goals,
    progress: calculateProgress(dailyTotal.totals, goals),
  }
}

/*
 * GET /stats/daily
 * Vraci denni agregaci food logu prihlaseneho uzivatele za obdobi.
 */
export const getStatsDaily = async (
  request: FastifyRequest<{ Querystring: StatsRangeQuery }>,
  reply: FastifyReply,
) => {
  const { from, to } = request.query

  if (from > to) {
    return reply.code(400).send({ error: 'Invalid date range' })
  }

  return {
    days: await getDailyStats(request.user.id, from, to),
  }
}

/*
 * GET /stats/summary
 * Vraci souhrn, prumery a plneni cilu z food logu prihlaseneho uzivatele za obdobi.
 */
export const getStatsSummary = async (
  request: FastifyRequest<{ Querystring: StatsRangeQuery }>,
  reply: FastifyReply,
) => {
  const { from, to } = request.query

  if (from > to) {
    return reply.code(400).send({ error: 'Invalid date range' })
  }

  const goals = await getUserGoals(request.user.id)

  if (!goals) {
    await sendProfileNotFound(reply)
    return
  }

  const days = await getDailyStats(request.user.id, from, to)
  const totals = sumDailyTotals(days)
  const averages = getAverageTotals(totals, days.length)

  return {
    from,
    to,
    daysCount: days.length,
    totals,
    averages,
    entriesCount: days.reduce((count, day) => count + day.count, 0),
    bestDay: getBestDay(days),
    worstDay: getWorstDay(days),
    goals,
    goalFulfillment: calculateProgress(averages, goals),
  }
}
