import type { FastifySchema } from 'fastify'
import type { FromSchema } from 'json-schema-to-ts'
import { schemaRef, updateProfileBodySchema } from './openapi'

export { updateProfileBodySchema }

export type UpdateProfileBody = FromSchema<typeof updateProfileBodySchema>

export const getProfileSchema = {
  tags: ['Profile'],
  summary: 'Get current profile',
  operationId: 'getProfile',
  response: {
    200: schemaRef('ProfileResponse'),
    401: schemaRef('ErrorResponse'),
    404: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema

export const updateProfileSchema = {
  tags: ['Profile'],
  summary: 'Update current profile',
  operationId: 'updateProfile',
  body: schemaRef('UpdateProfileBody'),
  response: {
    200: schemaRef('ProfileResponse'),
    401: schemaRef('ErrorResponse'),
    404: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema
