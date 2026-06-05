import type { FastifySchema } from 'fastify'
import type { FromSchema } from 'json-schema-to-ts'

const foodLogSourceSchema = {
  type: 'string',
  enum: ['plan', 'manual', 'barcode', 'ai', 'search'],
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

const dailyTotalSchema = {
  type: 'object',
  required: ['date', 'totals', 'count'],
  properties: {
    date: { type: 'string', format: 'date' },
    totals: macroSchema,
    count: { type: 'number' },
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

const foodLogResponseSchema = {
  type: 'object',
  required: ['log'],
  properties: {
    log: foodLogSchema,
  },
} as const

const errorResponseSchema = {
  type: 'object',
  required: ['error'],
  properties: {
    error: { type: 'string' },
  },
} as const

export const getFoodLogQuerySchema = {
  type: 'object',
  required: ['from', 'to'],
  properties: {
    from: { type: 'string', format: 'date' },
    to: { type: 'string', format: 'date' },
  },
} as const

export const foodLogParamsSchema = {
  type: 'object',
  required: ['logId'],
  properties: {
    logId: { type: 'string', format: 'uuid' },
  },
} as const

export const createFoodLogBodySchema = {
  type: 'object',
  required: ['eatenAt', 'nameSnapshot', 'kcalSnapshot', 'proteinSnapshot', 'carbsSnapshot', 'fatSnapshot', 'source'],
  properties: {
    eatenAt: { type: 'string', format: 'date-time' },
    nameSnapshot: { type: 'string', minLength: 1 },
    kcalSnapshot: { type: 'number', minimum: 0 },
    proteinSnapshot: { type: 'number', minimum: 0 },
    carbsSnapshot: { type: 'number', minimum: 0 },
    fatSnapshot: { type: 'number', minimum: 0 },
    quantityG: { type: ['number', 'null'], minimum: 0 },
    portions: { type: ['number', 'null'], minimum: 0 },
    source: foodLogSourceSchema,
    recipeId: { type: ['string', 'null'], format: 'uuid' },
    ingredientId: { type: ['string', 'null'], format: 'uuid' },
    planSlotId: { type: ['string', 'null'], format: 'uuid' },
  },
} as const

export const updateFoodLogBodySchema = {
  ...createFoodLogBodySchema,
  required: [],
} as const

export type GetFoodLogQuery = FromSchema<typeof getFoodLogQuerySchema>
export type FoodLogParams = FromSchema<typeof foodLogParamsSchema>
export type CreateFoodLogBody = FromSchema<typeof createFoodLogBodySchema>
export type UpdateFoodLogBody = FromSchema<typeof updateFoodLogBodySchema>

export const getFoodLogSchema = {
  tags: ['Food log'],
  summary: 'List food log',
  operationId: 'getFoodLog',
  querystring: getFoodLogQuerySchema,
  response: {
    200: {
      type: 'object',
      required: ['logs', 'dailyTotals', 'goals'],
      properties: {
        logs: {
          type: 'array',
          items: foodLogSchema,
        },
        dailyTotals: {
          type: 'array',
          items: dailyTotalSchema,
        },
        goals: goalsSchema,
      },
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema

export const createFoodLogSchema = {
  tags: ['Food log'],
  summary: 'Create food log',
  operationId: 'createFoodLog',
  body: createFoodLogBodySchema,
  response: {
    201: foodLogResponseSchema,
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema

export const getFoodLogDetailSchema = {
  tags: ['Food log'],
  summary: 'Get food log detail',
  operationId: 'getFoodLogDetail',
  params: foodLogParamsSchema,
  response: {
    200: foodLogResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema

export const updateFoodLogSchema = {
  tags: ['Food log'],
  summary: 'Update food log',
  operationId: 'updateFoodLog',
  params: foodLogParamsSchema,
  body: updateFoodLogBodySchema,
  response: {
    200: {
      type: 'object',
      required: ['log', 'dailyTotal'],
      properties: {
        log: foodLogSchema,
        dailyTotal: dailyTotalSchema,
      },
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema

export const deleteFoodLogSchema = {
  tags: ['Food log'],
  summary: 'Delete food log',
  operationId: 'deleteFoodLog',
  params: foodLogParamsSchema,
  response: {
    200: {
      type: 'object',
      required: ['success', 'dailyTotal'],
      properties: {
        success: { type: 'boolean' },
        dailyTotal: dailyTotalSchema,
      },
    },
    401: errorResponseSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema
