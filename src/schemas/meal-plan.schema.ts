import type { FastifySchema } from 'fastify'
import type { FromSchema } from 'json-schema-to-ts'

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

const slotIngredientInputSchema = {
  type: 'object',
  required: ['displayName', 'amountG'],
  properties: {
    ingredientId: { type: ['string', 'null'], format: 'uuid' },
    displayName: { type: 'string', minLength: 1 },
    amountG: { type: 'number', minimum: 0 },
    displayAmount: { type: ['number', 'null'] },
    displayUnit: { type: ['string', 'null'] },
    position: { type: 'number', minimum: 0 },
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

const mealPlanSlotResponseSchema = {
  type: 'object',
  required: ['slot'],
  properties: {
    slot: mealPlanSlotSchema,
  },
} as const

const errorResponseSchema = {
  type: 'object',
  required: ['error'],
  properties: {
    error: { type: 'string' },
  },
} as const

export const getMealPlanQuerySchema = {
  type: 'object',
  required: ['from', 'to'],
  properties: {
    from: { type: 'string', format: 'date' },
    to: { type: 'string', format: 'date' },
  },
} as const

export const mealPlanSlotParamsSchema = {
  type: 'object',
  required: ['slotId'],
  properties: {
    slotId: { type: 'string', format: 'uuid' },
  },
} as const

export const createMealPlanSlotBodySchema = {
  type: 'object',
  required: ['dayDate', 'slot'],
  properties: {
    dayDate: { type: 'string', format: 'date' },
    slot: mealSlotSchema,
    recipeId: { type: ['string', 'null'], format: 'uuid' },
    ingredients: {
      type: 'array',
      items: slotIngredientInputSchema,
    },
  },
} as const

export const updateMealPlanSlotBodySchema = {
  type: 'object',
  properties: {
    dayDate: { type: 'string', format: 'date' },
    slot: mealSlotSchema,
    recipeId: { type: ['string', 'null'], format: 'uuid' },
    eatenAt: { type: ['string', 'null'], format: 'date-time' },
  },
} as const

export const updateMealPlanSlotIngredientsBodySchema = {
  type: 'object',
  required: ['ingredients'],
  properties: {
    ingredients: {
      type: 'array',
      items: slotIngredientInputSchema,
    },
  },
} as const

export type GetMealPlanQuery = FromSchema<typeof getMealPlanQuerySchema>
export type MealPlanSlotParams = FromSchema<typeof mealPlanSlotParamsSchema>
export type CreateMealPlanSlotBody = FromSchema<typeof createMealPlanSlotBodySchema>
export type UpdateMealPlanSlotBody = FromSchema<typeof updateMealPlanSlotBodySchema>
export type UpdateMealPlanSlotIngredientsBody = FromSchema<typeof updateMealPlanSlotIngredientsBodySchema>

export const getMealPlanSchema = {
  tags: ['Meal plan'],
  summary: 'List meal plan',
  operationId: 'getMealPlan',
  querystring: getMealPlanQuerySchema,
  response: {
    200: {
      type: 'object',
      required: ['days'],
      properties: {
        days: {
          type: 'array',
          items: {
            type: 'object',
            required: ['date', 'slots'],
            properties: {
              date: { type: 'string', format: 'date' },
              slots: {
                type: 'array',
                items: mealPlanSlotSchema,
              },
            },
          },
        },
      },
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
  },
} satisfies FastifySchema

export const createMealPlanSlotSchema = {
  tags: ['Meal plan'],
  summary: 'Create meal plan slot',
  operationId: 'createMealPlanSlot',
  body: createMealPlanSlotBodySchema,
  response: {
    201: mealPlanSlotResponseSchema,
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema

export const getMealPlanSlotSchema = {
  tags: ['Meal plan'],
  summary: 'Get meal plan slot',
  operationId: 'getMealPlanSlot',
  params: mealPlanSlotParamsSchema,
  response: {
    200: mealPlanSlotResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema

export const updateMealPlanSlotSchema = {
  tags: ['Meal plan'],
  summary: 'Update meal plan slot',
  operationId: 'updateMealPlanSlot',
  params: mealPlanSlotParamsSchema,
  body: updateMealPlanSlotBodySchema,
  response: {
    200: mealPlanSlotResponseSchema,
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema

export const deleteMealPlanSlotSchema = {
  tags: ['Meal plan'],
  summary: 'Delete meal plan slot',
  operationId: 'deleteMealPlanSlot',
  params: mealPlanSlotParamsSchema,
  response: {
    200: {
      type: 'object',
      required: ['success'],
      properties: {
        success: { type: 'boolean' },
      },
    },
    401: errorResponseSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema

export const updateMealPlanSlotIngredientsSchema = {
  tags: ['Meal plan'],
  summary: 'Replace meal plan slot ingredients',
  operationId: 'updateMealPlanSlotIngredients',
  params: mealPlanSlotParamsSchema,
  body: updateMealPlanSlotIngredientsBodySchema,
  response: {
    200: mealPlanSlotResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema
