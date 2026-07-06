import type { FastifyInstance } from 'fastify'
import {
  archiveIngredient,
  createIngredient,
  getIngredient,
  getIngredients,
  resolveIngredientBarcode,
} from '../controllers/ingredients.controller'
import {
  type CreateIngredientBody,
  type GetIngredientsQuery,
  type IngredientParams,
  type ResolveIngredientBarcodeBody,
  archiveIngredientSchema,
  createIngredientSchema,
  getIngredientSchema,
  getIngredientsSchema,
  resolveIngredientBarcodeSchema,
} from '../schemas/ingredients.schema'

export const ingredientRoutes = async (app: FastifyInstance) => {
  app.post<{ Body: CreateIngredientBody }>(
    '/ingredients',
    { schema: createIngredientSchema, preHandler: app.authenticate },
    createIngredient,
  )

  app.patch<{ Params: IngredientParams }>(
    '/ingredients/:ingredientId/archive',
    { schema: archiveIngredientSchema, preHandler: app.authenticate },
    archiveIngredient,
  )

  app.post<{ Body: ResolveIngredientBarcodeBody }>(
    '/ingredients/barcode/resolve',
    { schema: resolveIngredientBarcodeSchema, preHandler: app.authenticate },
    resolveIngredientBarcode,
  )

  app.get<{ Params: IngredientParams }>(
    '/ingredients/:ingredientId',
    { schema: getIngredientSchema, preHandler: app.authenticate },
    getIngredient,
  )

  app.get<{ Querystring: GetIngredientsQuery }>(
    '/ingredients',
    { schema: getIngredientsSchema, preHandler: app.authenticate },
    getIngredients,
  )
}
