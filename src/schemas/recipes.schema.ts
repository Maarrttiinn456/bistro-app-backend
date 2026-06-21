import type { FastifySchema } from 'fastify'
import type { FromSchema } from 'json-schema-to-ts'
import {
  createRecipeBodySchema,
  mealSlotSchema,
  previewRecipeImportBodySchema,
  schemaRef,
  updateRecipeBodySchema,
} from './openapi'

export const recipeMutationBodySchema = createRecipeBodySchema
export const recipePatchBodySchema = updateRecipeBodySchema

export const recipeParamsSchema = {
  type: 'object',
  required: ['recipeId'],
  properties: {
    recipeId: { type: 'string', format: 'uuid' },
  },
} as const

export const getRecipesQuerySchema = {
  type: 'object',
  properties: {
    query: { type: 'string' },
    mealType: mealSlotSchema,
  },
} as const

export type GetRecipesQuery = FromSchema<typeof getRecipesQuerySchema>
export type RecipeMutationBody = FromSchema<typeof recipeMutationBodySchema>
export type RecipePatchBody = FromSchema<typeof recipePatchBodySchema>
export type RecipeParams = FromSchema<typeof recipeParamsSchema>

export const getRecipesSchema = {
  tags: ['Recipes'],
  summary: 'List recipes',
  operationId: 'getRecipes',
  querystring: getRecipesQuerySchema,
  response: {
    200: schemaRef('GetRecipesResponse'),
  },
} satisfies FastifySchema

export const createRecipeSchema = {
  tags: ['Recipes'],
  summary: 'Create recipe',
  operationId: 'createRecipe',
  body: schemaRef('CreateRecipeBody'),
  response: {
    201: schemaRef('RecipeDetailResponse'),
    501: schemaRef('NotImplementedResponse'),
  },
} satisfies FastifySchema

export const getRecipeSchema = {
  tags: ['Recipes'],
  summary: 'Get recipe detail',
  operationId: 'getRecipe',
  params: recipeParamsSchema,
  response: {
    200: schemaRef('RecipeDetailResponse'),
    501: schemaRef('NotImplementedResponse'),
  },
} satisfies FastifySchema

export const updateRecipeSchema = {
  tags: ['Recipes'],
  summary: 'Update recipe',
  operationId: 'updateRecipe',
  params: recipeParamsSchema,
  body: schemaRef('UpdateRecipeBody'),
  response: {
    200: schemaRef('RecipeDetailResponse'),
    501: schemaRef('NotImplementedResponse'),
  },
} satisfies FastifySchema

export const deleteRecipeSchema = {
  tags: ['Recipes'],
  summary: 'Delete recipe',
  operationId: 'deleteRecipe',
  params: recipeParamsSchema,
  response: {
    200: schemaRef('DeleteRecipeResponse'),
    501: schemaRef('NotImplementedResponse'),
  },
} satisfies FastifySchema

export const previewRecipeImportSchema = {
  tags: ['Recipes'],
  summary: 'Preview recipe import from URL',
  operationId: 'previewRecipeImport',
  body: schemaRef('PreviewRecipeImportBody'),
  response: {
    200: schemaRef('PreviewRecipeImportResponse'),
    501: schemaRef('NotImplementedResponse'),
  },
} satisfies FastifySchema

export { previewRecipeImportBodySchema }
