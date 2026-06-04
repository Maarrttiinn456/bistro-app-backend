import { and, asc, desc, eq, ilike, sql } from 'drizzle-orm'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { db } from '../db/client'
import { profiles, recipeIngredients, recipes } from '../db/schema'
import type {
  GetRecipesQuery,
  RecipeMutationBody,
  RecipeParams,
  RecipePatchBody,
} from '../schemas/recipes.schema'

type RecipeIngredientInput = NonNullable<RecipeMutationBody['ingredients']>[number]

// Docasna prazdna makra pro detail receptu, dokud nebude doplneny vypocet maker.
const emptyMacros = {
  kcal: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
}

// Prevadi Drizzle numeric hodnotu z DB na number pro JSON odpoved.
const toNumber = (value: string | number | null) => {
  if (value === null) {
    return null
  }

  return Number(value)
}

// Upravuje surovinu receptu z DB do tvaru, ktery vraci API.
const normalizeRecipeIngredient = (ingredient: typeof recipeIngredients.$inferSelect) => ({
  ...ingredient,
  amountG: Number(ingredient.amountG),
  displayAmount: toNumber(ingredient.displayAmount),
})

// Najde aktivni domacnost prihlaseneho uzivatele podle request.user.id.
const getActiveHouseholdId = async (userId: string) => {
  const [profile] = await db
    .select({ activeHouseholdId: profiles.activeHouseholdId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)

  return profile?.activeHouseholdId ?? null
}

// Vraci chybu, kdyz uzivatel nema nastavenou aktivni domacnost.
const sendMissingHousehold = async (reply: FastifyReply) => reply.code(400).send({
  error: 'Active household is missing',
})

// Vraci chybu, kdyz recept neexistuje nebo nepatri do aktivni domacnosti.
const sendNotFound = async (reply: FastifyReply) => reply.code(404).send({
  error: 'Recipe not found',
})

// Nacte detail jednoho receptu z aktivni domacnosti vcetne jeho surovin.
const getRecipeDetail = async (recipeId: string, householdId: string) => {
  const [recipe] = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.id, recipeId), eq(recipes.householdId, householdId)))
    .limit(1)

  if (!recipe) {
    return null
  }

  const ingredients = await db
    .select()
    .from(recipeIngredients)
    .where(eq(recipeIngredients.recipeId, recipe.id))
    .orderBy(asc(recipeIngredients.position), asc(recipeIngredients.createdAt))

  return {
    recipe: {
      ...recipe,
      ingredients: ingredients.map(normalizeRecipeIngredient),
      macrosTotal: emptyMacros,
    },
  }
}

// Prevadi surovinu z request body na insert tvar pro tabulku recipe_ingredients.
const mapIngredientInput = (recipeId: string, ingredient: RecipeIngredientInput, index: number) => ({
  recipeId,
  ingredientId: ingredient.ingredientId ?? null,
  displayName: ingredient.displayName,
  amountG: ingredient.amountG.toString(),
  displayAmount: ingredient.displayAmount?.toString() ?? null,
  displayUnit: ingredient.displayUnit ?? null,
  position: ingredient.position ?? index,
})

/*
 * GET /recipes
 * Vraci recepty z aktivni domacnosti uzivatele.
 */
export const getRecipes = async (
  request: FastifyRequest<{ Querystring: GetRecipesQuery }>,
  reply: FastifyReply,
) => {
  const query = request.query
  const householdId = await getActiveHouseholdId(request.user.id)

  if (!householdId) {
    await sendMissingHousehold(reply)
    return
  }

  const conditions = [eq(recipes.householdId, householdId)]

  if (query.query) {
    conditions.push(ilike(recipes.name, `%${query.query}%`))
  }

  if (query.mealType) {
    conditions.push(sql`${recipes.mealTypes} @> ARRAY[${query.mealType}]::text[]`)
  }

  const recipeRows = await db
    .select()
    .from(recipes)
    .where(and(...conditions))
    .orderBy(desc(recipes.createdAt))

  return { recipes: recipeRows }
}

/*
 * POST /recipes
 * Vytvori recept a jeho suroviny v aktivni domacnosti.
 */
export const createRecipe = async (
  request: FastifyRequest<{ Body: RecipeMutationBody }>,
  reply: FastifyReply,
) => {
  const householdId = await getActiveHouseholdId(request.user.id)

  if (!householdId) {
    await sendMissingHousehold(reply)
    return
  }

  const body = request.body

  const [recipe] = await db
    .insert(recipes)
    .values({
      householdId,
      createdBy: request.user.id,
      name: body.name ?? '',
      image: body.image ?? null,
      prepTimeMin: body.prepTimeMin ?? 0,
      portions: body.portions ?? 1,
      mealTypes: body.mealTypes ?? [],
      steps: body.steps ?? '',
      sourceUrl: body.sourceUrl ?? null,
    })
    .returning()

  if (body.ingredients?.length) {
    await db
      .insert(recipeIngredients)
      .values(body.ingredients.map((ingredient, index) => mapIngredientInput(recipe.id, ingredient, index)))
  }

  const detail = await getRecipeDetail(recipe.id, householdId)

  return reply.code(201).send(detail)
}

/*
 * GET /recipes/:recipeId
 * Vraci detail receptu vcetne surovin.
 */
export const getRecipe = async (
  request: FastifyRequest<{ Params: RecipeParams }>,
  reply: FastifyReply,
) => {
  const params = request.params
  const householdId = await getActiveHouseholdId(request.user.id)

  if (!householdId) {
    await sendMissingHousehold(reply)
    return
  }

  const detail = await getRecipeDetail(params.recipeId, householdId)

  if (!detail) {
    await sendNotFound(reply)
    return
  }

  return detail
}

/*
 * PATCH /recipes/:recipeId
 * Upravi recept a volitelne nahradi jeho suroviny.
 */
export const updateRecipe = async (
  request: FastifyRequest<{ Params: RecipeParams, Body: RecipePatchBody }>,
  reply: FastifyReply,
) => {
  const body = request.body
  const params = request.params
  const householdId = await getActiveHouseholdId(request.user.id)

  if (!householdId) {
    await sendMissingHousehold(reply)
    return
  }

  const [existingRecipe] = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(and(eq(recipes.id, params.recipeId), eq(recipes.householdId, householdId)))
    .limit(1)

  if (!existingRecipe) {
    await sendNotFound(reply)
    return
  }

  await db
    .update(recipes)
    .set({
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.image !== undefined ? { image: body.image } : {}),
      ...(body.prepTimeMin !== undefined ? { prepTimeMin: body.prepTimeMin } : {}),
      ...(body.portions !== undefined ? { portions: body.portions } : {}),
      ...(body.mealTypes !== undefined ? { mealTypes: body.mealTypes } : {}),
      ...(body.steps !== undefined ? { steps: body.steps } : {}),
      ...(body.sourceUrl !== undefined ? { sourceUrl: body.sourceUrl } : {}),
    })
    .where(eq(recipes.id, existingRecipe.id))

  if (body.ingredients) {
    await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, existingRecipe.id))

    if (body.ingredients.length) {
      await db
        .insert(recipeIngredients)
        .values(body.ingredients.map((ingredient, index) => mapIngredientInput(existingRecipe.id, ingredient, index)))
    }
  }

  const detail = await getRecipeDetail(existingRecipe.id, householdId)

  return reply.send(detail)
}

/*
 * DELETE /recipes/:recipeId
 * Smaze recept z aktivni domacnosti.
 */
export const deleteRecipe = async (
  request: FastifyRequest<{ Params: RecipeParams }>,
  reply: FastifyReply,
) => {
  const params = request.params
  const householdId = await getActiveHouseholdId(request.user.id)

  if (!householdId) {
    await sendMissingHousehold(reply)
    return
  }

  const [deletedRecipe] = await db
    .delete(recipes)
    .where(and(eq(recipes.id, params.recipeId), eq(recipes.householdId, householdId)))
    .returning({ id: recipes.id })

  if (!deletedRecipe) {
    await sendNotFound(reply)
    return
  }

  return reply.send({ success: true })
}

/*
 * POST /recipes/import-url/preview
 * Placeholder pro nahled importu receptu z URL.
 */
export const previewRecipeImport = async (_request: FastifyRequest, reply: FastifyReply) => reply.code(501).send({
  error: 'Not implemented',
})
