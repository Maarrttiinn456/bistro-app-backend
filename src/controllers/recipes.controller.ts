import { desc } from 'drizzle-orm'
import { db } from '../db/client'
import { recipes } from '../db/schema'

export const getRecipes = async () => {
  const recipeRows = await db.select().from(recipes).orderBy(desc(recipes.createdAt))

  return { recipes: recipeRows }
}
