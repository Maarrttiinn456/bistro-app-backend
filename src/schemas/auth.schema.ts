import type { FastifySchema } from 'fastify'
import type { FromSchema } from 'json-schema-to-ts'
import {
  loginBodySchema,
  refreshBodySchema,
  schemaRef,
  signUpBodySchema,
} from './openapi'

export { loginBodySchema, refreshBodySchema, signUpBodySchema }

export type SignUpBody = FromSchema<typeof signUpBodySchema>
export type LoginBody = FromSchema<typeof loginBodySchema>
export type RefreshBody = FromSchema<typeof refreshBodySchema>

export const signUpSchema = {
  tags: ['Auth'],
  summary: 'Sign up',
  operationId: 'signUp',
  body: schemaRef('SignUpBody'),
  response: {
    201: schemaRef('AuthContext'),
    400: schemaRef('ErrorResponse'),
    500: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema

export const loginSchema = {
  tags: ['Auth'],
  summary: 'Login',
  operationId: 'login',
  body: schemaRef('LoginBody'),
  response: {
    200: schemaRef('AuthContext'),
    400: schemaRef('ErrorResponse'),
    401: schemaRef('ErrorResponse'),
    500: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema

export const refreshSchema = {
  tags: ['Auth'],
  summary: 'Refresh session',
  operationId: 'refreshSession',
  body: schemaRef('RefreshBody'),
  response: {
    200: schemaRef('AuthContext'),
    400: schemaRef('ErrorResponse'),
    401: schemaRef('ErrorResponse'),
    500: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema

export const logoutSchema = {
  tags: ['Auth'],
  summary: 'Logout',
  operationId: 'logout',
  response: {
    200: schemaRef('LogoutResponse'),
    401: schemaRef('ErrorResponse'),
    500: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema

export const meSchema = {
  tags: ['Auth'],
  summary: 'Get current user',
  operationId: 'getMe',
  response: {
    200: schemaRef('AuthContext'),
    401: schemaRef('ErrorResponse'),
    404: schemaRef('ErrorResponse'),
  },
} satisfies FastifySchema
