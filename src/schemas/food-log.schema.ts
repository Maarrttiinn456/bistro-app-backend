import type { FastifySchema } from 'fastify'
import type { FromSchema } from 'json-schema-to-ts'
import {
  createFoodLogBodySchema,
  schemaRef,
  updateFoodLogBodySchema,
} from './openapi'

export { createFoodLogBodySchema, updateFoodLogBodySchema }

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
    200: schemaRef('GetFoodLogResponse'),
    400: schemaRef('ErrorResponse'),
    401: schemaRef('ErrorResponse'),
    404: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema

export const createFoodLogSchema = {
  tags: ['Food log'],
  summary: 'Create food log',
  operationId: 'createFoodLog',
  body: schemaRef('CreateFoodLogBody'),
  response: {
    201: schemaRef('FoodLogResponse'),
    400: schemaRef('ErrorResponse'),
    401: schemaRef('ErrorResponse'),
    404: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema

export const getFoodLogDetailSchema = {
  tags: ['Food log'],
  summary: 'Get food log detail',
  operationId: 'getFoodLogDetail',
  params: foodLogParamsSchema,
  response: {
    200: schemaRef('FoodLogResponse'),
    401: schemaRef('ErrorResponse'),
    404: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema

export const updateFoodLogSchema = {
  tags: ['Food log'],
  summary: 'Update food log',
  operationId: 'updateFoodLog',
  params: foodLogParamsSchema,
  body: schemaRef('UpdateFoodLogBody'),
  response: {
    200: schemaRef('UpdateFoodLogResponse'),
    400: schemaRef('ErrorResponse'),
    401: schemaRef('ErrorResponse'),
    404: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema

export const deleteFoodLogSchema = {
  tags: ['Food log'],
  summary: 'Delete food log',
  operationId: 'deleteFoodLog',
  params: foodLogParamsSchema,
  response: {
    200: schemaRef('DeleteFoodLogResponse'),
    401: schemaRef('ErrorResponse'),
    404: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema
