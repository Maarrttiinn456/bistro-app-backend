import type { FastifySchema } from 'fastify'
import type { FromSchema } from 'json-schema-to-ts'

const foodLogSourceSchema = {
  type: 'string',
  enum: ['plan', 'manual', 'barcode', 'ai', 'search'],
} as const

const mealSlotSchema = {
  type: 'string',
  enum: ['breakfast', 'lunch', 'dinner', 'snack'],
} as const

const macroSchema = {
  type: 'object',
  required: ['kcal', 'protein', 'carbs', 'fat'],
  properties: {
    kcal: { type: 'number' },
    protein: { type: 'number' },
    carbs: { type: 'number' },
    fat: { type: 'number' },
  },
} as const

const goalsSchema = {
  type: 'object',
  required: ['kcal', 'protein', 'carbs', 'fat'],
  properties: {
    kcal: { type: 'number' },
    protein: { type: 'number' },
    carbs: { type: 'number' },
    fat: { type: 'number' },
  },
} as const

const dailyTotalSchema = {
  type: 'object',
  required: ['date', 'totals', 'count'],
  properties: {
    date: { type: 'string', format: 'date' },
    totals: macroSchema,
    count: { type: 'number' },
  },
} as const

const progressSchema = {
  type: 'object',
  required: ['kcal', 'protein', 'carbs', 'fat'],
  properties: {
    kcal: { type: 'number' },
    protein: { type: 'number' },
    carbs: { type: 'number' },
    fat: { type: 'number' },
  },
} as const

const foodLogSchema = {
  type: 'object',
  required: [
    'id',
    'userId',
    'eatenAt',
    'nameSnapshot',
    'kcalSnapshot',
    'proteinSnapshot',
    'carbsSnapshot',
    'fatSnapshot',
    'quantityG',
    'portions',
    'source',
    'recipeId',
    'ingredientId',
    'planSlotId',
    'createdAt',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    eatenAt: { type: 'string', format: 'date-time' },
    nameSnapshot: { type: 'string' },
    kcalSnapshot: { type: 'number' },
    proteinSnapshot: { type: 'number' },
    carbsSnapshot: { type: 'number' },
    fatSnapshot: { type: 'number' },
    quantityG: { type: ['number', 'null'] },
    portions: { type: ['number', 'null'] },
    source: foodLogSourceSchema,
    recipeId: { type: ['string', 'null'], format: 'uuid' },
    ingredientId: { type: ['string', 'null'], format: 'uuid' },
    planSlotId: { type: ['string', 'null'], format: 'uuid' },
    createdAt: { type: 'string', format: 'date-time' },
  },
} as const

const slotIngredientSchema = {
  type: 'object',
  required: ['id', 'ingredientId', 'displayName', 'amountG', 'displayAmount', 'displayUnit', 'position', 'createdAt'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    ingredientId: { type: ['string', 'null'], format: 'uuid' },
    displayName: { type: 'string' },
    amountG: { type: 'number' },
    displayAmount: { type: ['number', 'null'] },
    displayUnit: { type: ['string', 'null'] },
    position: { type: 'number' },
    createdAt: { type: 'string', format: 'date-time' },
  },
} as const

const recipeSummarySchema = {
  type: 'object',
  required: ['id', 'name', 'image', 'portions', 'mealTypes'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    image: { type: ['string', 'null'] },
    portions: { type: 'number' },
    mealTypes: {
      type: 'array',
      items: mealSlotSchema,
    },
  },
} as const

const mealPlanSlotSchema = {
  type: 'object',
  required: [
    'id',
    'userId',
    'dayDate',
    'slot',
    'recipeId',
    'eatenAt',
    'createdAt',
    'recipe',
    'ingredients',
    'macrosTotal',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    dayDate: { type: 'string', format: 'date' },
    slot: mealSlotSchema,
    recipeId: { type: ['string', 'null'], format: 'uuid' },
    eatenAt: { type: ['string', 'null'], format: 'date-time' },
    createdAt: { type: 'string', format: 'date-time' },
    recipe: {
      anyOf: [
        recipeSummarySchema,
        { type: 'null' },
      ],
    },
    ingredients: {
      type: 'array',
      items: slotIngredientSchema,
    },
    macrosTotal: macroSchema,
  },
} as const

const summaryDaySchema = {
  anyOf: [
    dailyTotalSchema,
    { type: 'null' },
  ],
} as const

const errorResponseSchema = {
  type: 'object',
  required: ['error'],
  properties: {
    error: { type: 'string' },
  },
} as const

export const dashboardTodayQuerySchema = {
  type: 'object',
  required: ['date'],
  properties: {
    date: { type: 'string', format: 'date' },
  },
} as const

export const statsRangeQuerySchema = {
  type: 'object',
  required: ['from', 'to'],
  properties: {
    from: { type: 'string', format: 'date' },
    to: { type: 'string', format: 'date' },
  },
} as const

export type DashboardTodayQuery = FromSchema<typeof dashboardTodayQuerySchema>
export type StatsRangeQuery = FromSchema<typeof statsRangeQuerySchema>

export const getDashboardTodaySchema = {
  tags: ['Overview'],
  summary: 'Get dashboard today',
  operationId: 'getDashboardToday',
  querystring: dashboardTodayQuerySchema,
  response: {
    200: {
      type: 'object',
      required: ['date', 'plan', 'logs', 'dailyTotal', 'goals', 'progress'],
      properties: {
        date: { type: 'string', format: 'date' },
        plan: {
          type: 'object',
          required: ['slots'],
          properties: {
            slots: {
              type: 'array',
              items: mealPlanSlotSchema,
            },
          },
        },
        logs: {
          type: 'array',
          items: foodLogSchema,
        },
        dailyTotal: dailyTotalSchema,
        goals: goalsSchema,
        progress: progressSchema,
      },
    },
    401: errorResponseSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema

export const getStatsDailySchema = {
  tags: ['Overview'],
  summary: 'Get daily stats',
  operationId: 'getStatsDaily',
  querystring: statsRangeQuerySchema,
  response: {
    200: {
      type: 'object',
      required: ['days'],
      properties: {
        days: {
          type: 'array',
          items: dailyTotalSchema,
        },
      },
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
  },
} satisfies FastifySchema

export const getStatsSummarySchema = {
  tags: ['Overview'],
  summary: 'Get stats summary',
  operationId: 'getStatsSummary',
  querystring: statsRangeQuerySchema,
  response: {
    200: {
      type: 'object',
      required: ['from', 'to', 'daysCount', 'totals', 'averages', 'entriesCount', 'bestDay', 'worstDay', 'goals', 'goalFulfillment'],
      properties: {
        from: { type: 'string', format: 'date' },
        to: { type: 'string', format: 'date' },
        daysCount: { type: 'number' },
        totals: macroSchema,
        averages: macroSchema,
        entriesCount: { type: 'number' },
        bestDay: summaryDaySchema,
        worstDay: summaryDaySchema,
        goals: goalsSchema,
        goalFulfillment: progressSchema,
      },
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema
