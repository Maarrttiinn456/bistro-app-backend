import type { FastifySchema } from 'fastify'
import type { FromSchema } from 'json-schema-to-ts'

const ingredientSchema = {
  type: 'object',
  required: [
    'id',
    'householdId',
    'name',
    'brand',
    'barcode',
    'baseUnit',
    'kcalPer100',
    'proteinPer100',
    'carbsPer100',
    'fatPer100',
    'servingGrams',
    'servingLabel',
    'createdAt',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    householdId: { type: ['string', 'null'], format: 'uuid' },
    name: { type: 'string' },
    brand: { type: ['string', 'null'] },
    barcode: { type: ['string', 'null'] },
    baseUnit: { type: 'string', enum: ['g', 'ml'] },
    kcalPer100: { type: 'number' },
    proteinPer100: { type: 'number' },
    carbsPer100: { type: 'number' },
    fatPer100: { type: 'number' },
    servingGrams: { type: ['number', 'null'] },
    servingLabel: { type: ['string', 'null'] },
    createdAt: { type: 'string', format: 'date-time' },
  },
} as const

const errorResponseSchema = {
  type: 'object',
  required: ['error'],
  properties: {
    error: { type: 'string' },
  },
} as const

export const getIngredientsQuerySchema = {
  type: 'object',
  properties: {
    query: { type: 'string' },
    scope: { type: 'string', enum: ['all', 'global', 'household'] },
  },
} as const

export type GetIngredientsQuery = FromSchema<typeof getIngredientsQuerySchema>

export const getIngredientsSchema = {
  tags: ['Ingredients'],
  summary: 'List ingredients',
  operationId: 'getIngredients',
  querystring: getIngredientsQuerySchema,
  response: {
    200: {
      type: 'object',
      required: ['ingredients'],
      properties: {
        ingredients: {
          type: 'array',
          items: ingredientSchema,
        },
      },
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
  },
} satisfies FastifySchema
