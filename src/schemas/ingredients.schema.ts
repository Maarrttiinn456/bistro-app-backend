import type { FastifySchema } from 'fastify'
import type { FromSchema } from 'json-schema-to-ts'
import { createIngredientBodySchema, resolveIngredientBarcodeBodySchema, schemaRef, updateIngredientBodySchema } from './openapi'

export const ingredientParamsSchema = {
  type: 'object',
  required: ['ingredientId'],
  properties: {
    ingredientId: { type: 'string', format: 'uuid' },
  },
} as const

export const getIngredientsQuerySchema = {
  type: 'object',
  properties: {
    query: { type: 'string' },
    scope: { type: 'string', enum: ['all', 'global', 'household'] },
  },
} as const

export type IngredientParams = FromSchema<typeof ingredientParamsSchema>
export type GetIngredientsQuery = FromSchema<typeof getIngredientsQuerySchema>
export type CreateIngredientBody = FromSchema<typeof createIngredientBodySchema>
export type UpdateIngredientBody = FromSchema<typeof updateIngredientBodySchema>
export type ResolveIngredientBarcodeBody = FromSchema<typeof resolveIngredientBarcodeBodySchema>

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

export const getIngredientSchema = {
  tags: ['Ingredients'],
  summary: 'Get ingredient detail',
  operationId: 'getIngredient',
  params: ingredientParamsSchema,
  response: {
    200: schemaRef('IngredientResponse'),
    400: schemaRef('ErrorResponse'),
    401: schemaRef('ErrorResponse'),
    404: schemaRef('ErrorResponse'),
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

export const updateIngredientSchema = {
  tags: ['Ingredients'],
  summary: 'Update ingredient',
  operationId: 'updateIngredient',
  params: ingredientParamsSchema,
  body: schemaRef('UpdateIngredientBody'),
  response: {
    200: schemaRef('IngredientResponse'),
    400: schemaRef('ErrorResponse'),
    401: schemaRef('ErrorResponse'),
    404: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema

export const archiveIngredientSchema = {
  tags: ['Ingredients'],
  summary: 'Archive ingredient',
  operationId: 'archiveIngredient',
  params: ingredientParamsSchema,
  response: {
    200: schemaRef('IngredientResponse'),
    400: schemaRef('ErrorResponse'),
    401: schemaRef('ErrorResponse'),
    404: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema

export const resolveIngredientBarcodeSchema = {
  tags: ['Ingredients'],
  summary: 'Resolve ingredient by barcode',
  operationId: 'resolveIngredientBarcode',
  body: schemaRef('ResolveIngredientBarcodeBody'),
  response: {
    200: schemaRef('ResolveIngredientBarcodeResponse'),
    400: schemaRef('ErrorResponse'),
    401: schemaRef('ErrorResponse'),
    404: schemaRef('ErrorResponse'),
    422: schemaRef('ErrorResponse'),
    502: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema
