import type { FastifyInstance } from 'fastify'
import { createIngredient, getIngredients } from '../controllers/ingredients.controller'
import {
  type CreateIngredientBody,
  type GetIngredientsQuery,
  createIngredientSchema,
  getIngredientsSchema,
} from '../schemas/ingredients.schema'

export const ingredientRoutes = async (app: FastifyInstance) => {
  app.post<{ Body: CreateIngredientBody }>(
    '/ingredients',
    { schema: createIngredientSchema, preHandler: app.authenticate },
    createIngredient,
  )

  app.get<{ Querystring: GetIngredientsQuery }>(
    '/ingredients',
    { schema: getIngredientsSchema, preHandler: app.authenticate },
    getIngredients,
  )
}
