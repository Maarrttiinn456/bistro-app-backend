import type { FastifyInstance } from 'fastify'
import {
  createFoodLog,
  deleteFoodLog,
  getFoodLog,
  getFoodLogDetail,
  updateFoodLog,
} from '../controllers/food-log.controller'
import {
  type CreateFoodLogBody,
  type FoodLogParams,
  type GetFoodLogQuery,
  type UpdateFoodLogBody,
  createFoodLogSchema,
  deleteFoodLogSchema,
  getFoodLogDetailSchema,
  getFoodLogSchema,
  updateFoodLogSchema,
} from '../schemas/food-log.schema'

export const foodLogRoutes = async (app: FastifyInstance) => {
  app.get<{ Querystring: GetFoodLogQuery }>(
    '/food-log',
    { schema: getFoodLogSchema, preHandler: app.authenticate },
    getFoodLog,
  )

  app.post<{ Body: CreateFoodLogBody }>(
    '/food-log',
    { schema: createFoodLogSchema, preHandler: app.authenticate },
    createFoodLog,
  )

  app.get<{ Params: FoodLogParams }>(
    '/food-log/:logId',
    { schema: getFoodLogDetailSchema, preHandler: app.authenticate },
    getFoodLogDetail,
  )

  app.patch<{ Params: FoodLogParams, Body: UpdateFoodLogBody }>(
    '/food-log/:logId',
    { schema: updateFoodLogSchema, preHandler: app.authenticate },
    updateFoodLog,
  )

  app.delete<{ Params: FoodLogParams }>(
    '/food-log/:logId',
    { schema: deleteFoodLogSchema, preHandler: app.authenticate },
    deleteFoodLog,
  )
}
