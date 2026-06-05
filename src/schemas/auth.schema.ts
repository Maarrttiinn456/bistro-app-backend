import type { FastifySchema } from 'fastify'
import type { FromSchema } from 'json-schema-to-ts'

const authUserSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: ['string', 'null'], format: 'email' },
  },
} as const

const authSessionSchema = {
  type: 'object',
  required: ['accessToken', 'refreshToken', 'expiresIn', 'tokenType'],
  properties: {
    accessToken: { type: ['string', 'null'] },
    refreshToken: { type: ['string', 'null'] },
    expiresIn: { type: ['number', 'null'] },
    tokenType: { type: ['string', 'null'] },
  },
} as const

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

const householdSchema = {
  type: 'object',
  required: ['id', 'name', 'createdAt'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    createdBy: { type: ['string', 'null'], format: 'uuid' },
    createdAt: { type: 'string', format: 'date-time' },
  },
} as const

const householdMembershipSchema = {
  type: 'object',
  required: ['householdId', 'userId', 'role', 'joinedAt', 'household'],
  properties: {
    householdId: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    role: { type: 'string', enum: ['owner', 'member'] },
    joinedAt: { type: 'string', format: 'date-time' },
    household: householdSchema,
  },
} as const

const authContextSchema = {
  type: 'object',
  required: ['user', 'session', 'profile', 'activeHousehold', 'households'],
  properties: {
    user: authUserSchema,
    session: authSessionSchema,
    profile: profileSchema,
    activeHousehold: {
      anyOf: [
        householdSchema,
        { type: 'null' },
      ],
    },
    households: {
      type: 'array',
      items: householdMembershipSchema,
    },
  },
} as const

const errorResponseSchema = {
  type: 'object',
  required: ['error'],
  properties: {
    error: { type: 'string' },
  },
} as const

export const signUpBodySchema = {
  type: 'object',
  required: ['email', 'password', 'name'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 6 },
    name: { type: 'string', minLength: 1 },
  },
} as const

export const loginBodySchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 1 },
  },
} as const

export const refreshBodySchema = {
  type: 'object',
  required: ['refreshToken'],
  properties: {
    refreshToken: { type: 'string', minLength: 1 },
  },
} as const

export type SignUpBody = FromSchema<typeof signUpBodySchema>
export type LoginBody = FromSchema<typeof loginBodySchema>
export type RefreshBody = FromSchema<typeof refreshBodySchema>

export const signUpSchema = {
  tags: ['Auth'],
  summary: 'Sign up',
  operationId: 'signUp',
  body: signUpBodySchema,
  response: {
    201: authContextSchema,
    400: errorResponseSchema,
    500: errorResponseSchema,
  },
} satisfies FastifySchema

export const loginSchema = {
  tags: ['Auth'],
  summary: 'Login',
  operationId: 'login',
  body: loginBodySchema,
  response: {
    200: authContextSchema,
    400: errorResponseSchema,
    401: errorResponseSchema,
    500: errorResponseSchema,
  },
} satisfies FastifySchema

export const refreshSchema = {
  tags: ['Auth'],
  summary: 'Refresh session',
  operationId: 'refreshSession',
  body: refreshBodySchema,
  response: {
    200: authContextSchema,
    400: errorResponseSchema,
    401: errorResponseSchema,
    500: errorResponseSchema,
  },
} satisfies FastifySchema

export const logoutSchema = {
  tags: ['Auth'],
  summary: 'Logout',
  operationId: 'logout',
  response: {
    200: {
      type: 'object',
      required: ['success'],
      properties: {
        success: { type: 'boolean' },
      },
    },
    401: errorResponseSchema,
    500: errorResponseSchema,
  },
} satisfies FastifySchema

export const meSchema = {
  tags: ['Auth'],
  summary: 'Get current user',
  operationId: 'getMe',
  response: {
    200: authContextSchema,
    401: errorResponseSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema
