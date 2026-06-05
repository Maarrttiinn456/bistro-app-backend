import type { FastifySchema } from 'fastify'
import type { FromSchema } from 'json-schema-to-ts'

const profileSchema = {
  type: 'object',
  required: [
    'id',
    'name',
    'email',
    'goalKcal',
    'goalProtein',
    'goalCarbs',
    'goalFat',
    'activeHouseholdId',
    'createdAt',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    avatarUrl: { type: ['string', 'null'] },
    aiNotes: { type: ['string', 'null'] },
    goalKcal: { type: 'number' },
    goalProtein: { type: 'number' },
    goalCarbs: { type: 'number' },
    goalFat: { type: 'number' },
    activeHouseholdId: { type: ['string', 'null'], format: 'uuid' },
    createdAt: { type: 'string', format: 'date-time' },
  },
} as const

const profileResponseSchema = {
  type: 'object',
  required: ['profile'],
  properties: {
    profile: profileSchema,
  },
} as const

const errorResponseSchema = {
  type: 'object',
  required: ['error'],
  properties: {
    error: { type: 'string' },
  },
} as const

export const updateProfileBodySchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    avatarUrl: { type: ['string', 'null'] },
    aiNotes: { type: ['string', 'null'] },
    goalKcal: { type: 'number', minimum: 0 },
    goalProtein: { type: 'number', minimum: 0 },
    goalCarbs: { type: 'number', minimum: 0 },
    goalFat: { type: 'number', minimum: 0 },
  },
} as const

export type UpdateProfileBody = FromSchema<typeof updateProfileBodySchema>

export const getProfileSchema = {
  tags: ['Profile'],
  summary: 'Get current profile',
  operationId: 'getProfile',
  response: {
    200: profileResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema

export const updateProfileSchema = {
  tags: ['Profile'],
  summary: 'Update current profile',
  operationId: 'updateProfile',
  body: updateProfileBodySchema,
  response: {
    200: profileResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema
