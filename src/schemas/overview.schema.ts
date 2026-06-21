import type { FastifySchema } from 'fastify'
import type { FromSchema } from 'json-schema-to-ts'
import { schemaRef } from './openapi'

export const dashboardTodayQuerySchema = {
  type: 'object',
  required: ['date'],
  properties: {
    date: { type: 'string', format: 'date' },
  },
} as const

export const statsRangeQuerySchema = {
  type: 'object',
  required: ['from', 'to'],
  properties: {
    from: { type: 'string', format: 'date' },
    to: { type: 'string', format: 'date' },
  },
} as const

export type DashboardTodayQuery = FromSchema<typeof dashboardTodayQuerySchema>
export type StatsRangeQuery = FromSchema<typeof statsRangeQuerySchema>

export const getDashboardTodaySchema = {
  tags: ['Overview'],
  summary: 'Get dashboard today',
  operationId: 'getDashboardToday',
  querystring: dashboardTodayQuerySchema,
  response: {
    200: schemaRef('DashboardTodayResponse'),
    401: schemaRef('ErrorResponse'),
    404: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema

export const getStatsDailySchema = {
  tags: ['Overview'],
  summary: 'Get daily stats',
  operationId: 'getStatsDaily',
  querystring: statsRangeQuerySchema,
  response: {
    200: schemaRef('StatsDailyResponse'),
    400: schemaRef('ErrorResponse'),
    401: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema

export const getStatsSummarySchema = {
  tags: ['Overview'],
  summary: 'Get stats summary',
  operationId: 'getStatsSummary',
  querystring: statsRangeQuerySchema,
  response: {
    200: schemaRef('StatsSummaryResponse'),
    400: schemaRef('ErrorResponse'),
    401: schemaRef('ErrorResponse'),
    404: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema
