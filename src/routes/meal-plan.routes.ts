import type { FastifyInstance } from 'fastify'
import {
  createMealPlanSlot,
  deleteMealPlanSlot,
  getMealPlan,
  getMealPlanSlot,
  updateMealPlanSlot,
  updateMealPlanSlotIngredients,
} from '../controllers/meal-plan.controller'
import {
  type CreateMealPlanSlotBody,
  type GetMealPlanQuery,
  type MealPlanSlotParams,
  type UpdateMealPlanSlotBody,
  type UpdateMealPlanSlotIngredientsBody,
  createMealPlanSlotSchema,
  deleteMealPlanSlotSchema,
  getMealPlanSchema,
  getMealPlanSlotSchema,
  updateMealPlanSlotIngredientsSchema,
  updateMealPlanSlotSchema,
} from '../schemas/meal-plan.schema'

export const mealPlanRoutes = async (app: FastifyInstance) => {
  app.get<{ Querystring: GetMealPlanQuery }>(
    '/meal-plan',
    { schema: getMealPlanSchema, preHandler: app.authenticate },
    getMealPlan,
  )

  app.post<{ Body: CreateMealPlanSlotBody }>(
    '/meal-plan/slots',
    { schema: createMealPlanSlotSchema, preHandler: app.authenticate },
    createMealPlanSlot,
  )

  app.get<{ Params: MealPlanSlotParams }>(
    '/meal-plan/slots/:slotId',
    { schema: getMealPlanSlotSchema, preHandler: app.authenticate },
    getMealPlanSlot,
  )

  app.patch<{ Params: MealPlanSlotParams, Body: UpdateMealPlanSlotBody }>(
    '/meal-plan/slots/:slotId',
    { schema: updateMealPlanSlotSchema, preHandler: app.authenticate },
    updateMealPlanSlot,
  )

  app.delete<{ Params: MealPlanSlotParams }>(
    '/meal-plan/slots/:slotId',
    { schema: deleteMealPlanSlotSchema, preHandler: app.authenticate },
    deleteMealPlanSlot,
  )

  app.put<{ Params: MealPlanSlotParams, Body: UpdateMealPlanSlotIngredientsBody }>(
    '/meal-plan/slots/:slotId/ingredients',
    { schema: updateMealPlanSlotIngredientsSchema, preHandler: app.authenticate },
    updateMealPlanSlotIngredients,
  )
}
