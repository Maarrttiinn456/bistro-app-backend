import type { FastifyInstance } from 'fastify'
import { getIngredients } from '../controllers/ingredients.controller'
import {
  type GetIngredientsQuery,
  getIngredientsSchema,
} from '../schemas/ingredients.schema'

export const ingredientRoutes = async (app: FastifyInstance) => {
  app.get<{ Querystring: GetIngredientsQuery }>(
    '/ingredients',
    { schema: getIngredientsSchema, preHandler: app.authenticate },
    getIngredients,
  )
}
