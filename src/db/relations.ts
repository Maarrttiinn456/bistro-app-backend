import { relations } from 'drizzle-orm'
import {
  households,
  profiles,
  householdMembers,
  ingredients,
  recipes,
  recipeIngredients,
  mealPlanSlots,
  mealPlanSlotIngredients,
  foodLog,
  shoppingLists,
  shoppingListItems,
} from './schema'

export const householdsRelations = relations(households, ({ one, many }) => ({
  createdBy: one(profiles, { fields: [households.createdBy], references: [profiles.id] }),
  members: many(householdMembers),
  ingredients: many(ingredients),
  recipes: many(recipes),
}))

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  activeHousehold: one(households, { fields: [profiles.activeHouseholdId], references: [households.id] }),
  householdMemberships: many(householdMembers),
  mealPlanSlots: many(mealPlanSlots),
  foodLog: many(foodLog),
  shoppingLists: many(shoppingLists),
}))

export const householdMembersRelations = relations(householdMembers, ({ one }) => ({
  household: one(households, { fields: [householdMembers.householdId], references: [households.id] }),
  user: one(profiles, { fields: [householdMembers.userId], references: [profiles.id] }),
}))

export const ingredientsRelations = relations(ingredients, ({ one, many }) => ({
  household: one(households, { fields: [ingredients.householdId], references: [households.id] }),
  recipeIngredients: many(recipeIngredients),
  slotIngredients: many(mealPlanSlotIngredients),
  foodLog: many(foodLog),
  shoppingListItems: many(shoppingListItems),
}))

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  household: one(households, { fields: [recipes.householdId], references: [households.id] }),
  createdBy: one(profiles, { fields: [recipes.createdBy], references: [profiles.id] }),
  ingredients: many(recipeIngredients),
  mealPlanSlots: many(mealPlanSlots),
  foodLog: many(foodLog),
}))

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeIngredients.recipeId], references: [recipes.id] }),
  ingredient: one(ingredients, { fields: [recipeIngredients.ingredientId], references: [ingredients.id] }),
}))

export const mealPlanSlotsRelations = relations(mealPlanSlots, ({ one, many }) => ({
  user: one(profiles, { fields: [mealPlanSlots.userId], references: [profiles.id] }),
  recipe: one(recipes, { fields: [mealPlanSlots.recipeId], references: [recipes.id] }),
  ingredients: many(mealPlanSlotIngredients),
  foodLog: many(foodLog),
}))

export const mealPlanSlotIngredientsRelations = relations(mealPlanSlotIngredients, ({ one }) => ({
  slot: one(mealPlanSlots, { fields: [mealPlanSlotIngredients.slotId], references: [mealPlanSlots.id] }),
  ingredient: one(ingredients, { fields: [mealPlanSlotIngredients.ingredientId], references: [ingredients.id] }),
}))

export const foodLogRelations = relations(foodLog, ({ one }) => ({
  user: one(profiles, { fields: [foodLog.userId], references: [profiles.id] }),
  recipe: one(recipes, { fields: [foodLog.recipeId], references: [recipes.id] }),
  ingredient: one(ingredients, { fields: [foodLog.ingredientId], references: [ingredients.id] }),
  planSlot: one(mealPlanSlots, { fields: [foodLog.planSlotId], references: [mealPlanSlots.id] }),
}))

export const shoppingListsRelations = relations(shoppingLists, ({ one, many }) => ({
  user: one(profiles, { fields: [shoppingLists.userId], references: [profiles.id] }),
  items: many(shoppingListItems),
}))

export const shoppingListItemsRelations = relations(shoppingListItems, ({ one }) => ({
  list: one(shoppingLists, { fields: [shoppingListItems.shoppingListId], references: [shoppingLists.id] }),
  ingredient: one(ingredients, { fields: [shoppingListItems.ingredientId], references: [ingredients.id] }),
}))
