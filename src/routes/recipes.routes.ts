import type { FastifyInstance } from 'fastify'
import { getRecipes } from '../controllers/recipes.controller'
import { getRecipesSchema } from '../schemas/recipes.schema'

export const recipeRoutes = async (app: FastifyInstance) => {
  app.get('/recipes', { schema: getRecipesSchema }, getRecipes)
}
