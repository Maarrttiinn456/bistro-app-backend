import type { FastifyInstance } from 'fastify'
import {
  createRecipe,
  deleteRecipe,
  getRecipe,
  getRecipes,
  previewRecipeImport,
  updateRecipe,
} from '../controllers/recipes.controller'
import {
  type GetRecipesQuery,
  type RecipeMutationBody,
  type RecipeParams,
  type RecipePatchBody,
  createRecipeSchema,
  deleteRecipeSchema,
  getRecipeSchema,
  getRecipesSchema,
  previewRecipeImportSchema,
  updateRecipeSchema,
} from '../schemas/recipes.schema'

export const recipeRoutes = async (app: FastifyInstance) => {
  app.get<{ Querystring: GetRecipesQuery }>(
    '/recipes',
    { schema: getRecipesSchema, preHandler: app.authenticate },
    getRecipes,
  )

  app.post<{ Body: RecipeMutationBody }>(
    '/recipes',
    { schema: createRecipeSchema, preHandler: app.authenticate },
    createRecipe,
  )

  app.post(
    '/recipes/import-url/preview',
    { schema: previewRecipeImportSchema, preHandler: app.authenticate },
    previewRecipeImport,
  )

  app.get<{ Params: RecipeParams }>(
    '/recipes/:recipeId',
    { schema: getRecipeSchema, preHandler: app.authenticate },
    getRecipe,
  )

  app.patch<{ Params: RecipeParams, Body: RecipePatchBody }>(
    '/recipes/:recipeId',
    { schema: updateRecipeSchema, preHandler: app.authenticate },
    updateRecipe,
  )

  app.delete<{ Params: RecipeParams }>(
    '/recipes/:recipeId',
    { schema: deleteRecipeSchema, preHandler: app.authenticate },
    deleteRecipe,
  )
}
