import type { FastifyInstance } from 'fastify'
import { getDashboardToday, getStatsDaily, getStatsSummary } from '../controllers/overview.controller'
import {
  type DashboardTodayQuery,
  type StatsRangeQuery,
  getDashboardTodaySchema,
  getStatsDailySchema,
  getStatsSummarySchema,
} from '../schemas/overview.schema'

export const overviewRoutes = async (app: FastifyInstance) => {
  app.get<{ Querystring: DashboardTodayQuery }>(
    '/dashboard/today',
    { schema: getDashboardTodaySchema, preHandler: app.authenticate },
    getDashboardToday,
  )

  app.get<{ Querystring: StatsRangeQuery }>(
    '/stats/daily',
    { schema: getStatsDailySchema, preHandler: app.authenticate },
    getStatsDaily,
  )

  app.get<{ Querystring: StatsRangeQuery }>(
    '/stats/summary',
    { schema: getStatsSummarySchema, preHandler: app.authenticate },
    getStatsSummary,
  )
}
