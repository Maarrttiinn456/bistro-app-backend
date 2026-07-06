import type { FastifySchema } from 'fastify'
import type { FromSchema } from 'json-schema-to-ts'
import { createIngredientBodySchema, schemaRef } from './openapi'

export const getIngredientsQuerySchema = {
  type: 'object',
  properties: {
    query: { type: 'string' },
    scope: { type: 'string', enum: ['all', 'global', 'household'] },
  },
} as const

export type GetIngredientsQuery = FromSchema<typeof getIngredientsQuerySchema>
export type CreateIngredientBody = FromSchema<typeof createIngredientBodySchema>

export const getIngredientsSchema = {
  tags: ['Ingredients'],
  summary: 'List ingredients',
  operationId: 'getIngredients',
  querystring: getIngredientsQuerySchema,
  response: {
    200: schemaRef('GetIngredientsResponse'),
    400: schemaRef('ErrorResponse'),
    401: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema

export const createIngredientSchema = {
  tags: ['Ingredients'],
  summary: 'Create ingredient',
  operationId: 'createIngredient',
  body: schemaRef('CreateIngredientBody'),
  response: {
    201: schemaRef('IngredientResponse'),
    400: schemaRef('ErrorResponse'),
    401: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema
