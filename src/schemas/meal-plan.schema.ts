import type { FastifySchema } from 'fastify'
import type { FromSchema } from 'json-schema-to-ts'
import {
  createMealPlanSlotBodySchema,
  schemaRef,
  updateMealPlanSlotBodySchema,
  updateMealPlanSlotIngredientsBodySchema,
} from './openapi'

export {
  createMealPlanSlotBodySchema,
  updateMealPlanSlotBodySchema,
  updateMealPlanSlotIngredientsBodySchema,
}

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
    200: schemaRef('GetMealPlanResponse'),
    400: schemaRef('ErrorResponse'),
    401: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema

export const createMealPlanSlotSchema = {
  tags: ['Meal plan'],
  summary: 'Create meal plan slot',
  operationId: 'createMealPlanSlot',
  body: schemaRef('CreateMealPlanSlotBody'),
  response: {
    201: schemaRef('MealPlanSlotResponse'),
    400: schemaRef('ErrorResponse'),
    401: schemaRef('ErrorResponse'),
    404: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema

export const getMealPlanSlotSchema = {
  tags: ['Meal plan'],
  summary: 'Get meal plan slot',
  operationId: 'getMealPlanSlot',
  params: mealPlanSlotParamsSchema,
  response: {
    200: schemaRef('MealPlanSlotResponse'),
    401: schemaRef('ErrorResponse'),
    404: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema

export const updateMealPlanSlotSchema = {
  tags: ['Meal plan'],
  summary: 'Update meal plan slot',
  operationId: 'updateMealPlanSlot',
  params: mealPlanSlotParamsSchema,
  body: schemaRef('UpdateMealPlanSlotBody'),
  response: {
    200: schemaRef('MealPlanSlotResponse'),
    400: schemaRef('ErrorResponse'),
    401: schemaRef('ErrorResponse'),
    404: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema

export const deleteMealPlanSlotSchema = {
  tags: ['Meal plan'],
  summary: 'Delete meal plan slot',
  operationId: 'deleteMealPlanSlot',
  params: mealPlanSlotParamsSchema,
  response: {
    200: schemaRef('DeleteMealPlanSlotResponse'),
    401: schemaRef('ErrorResponse'),
    404: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema

export const updateMealPlanSlotIngredientsSchema = {
  tags: ['Meal plan'],
  summary: 'Replace meal plan slot ingredients',
  operationId: 'updateMealPlanSlotIngredients',
  params: mealPlanSlotParamsSchema,
  body: schemaRef('UpdateMealPlanSlotIngredientsBody'),
  response: {
    200: schemaRef('MealPlanSlotResponse'),
    401: schemaRef('ErrorResponse'),
    404: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema
