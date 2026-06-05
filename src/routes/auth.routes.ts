import type { FastifyInstance } from 'fastify'
import { login, logout, me, refresh, signUp } from '../controllers/auth.controller'
import {
  type LoginBody,
  type RefreshBody,
  type SignUpBody,
  loginSchema,
  logoutSchema,
  meSchema,
  refreshSchema,
  signUpSchema,
} from '../schemas/auth.schema'

export const authRoutes = async (app: FastifyInstance) => {
  app.post<{ Body: SignUpBody }>(
    '/auth/signup',
    { schema: signUpSchema },
    signUp,
  )

  app.post<{ Body: LoginBody }>(
    '/auth/login',
    { schema: loginSchema },
    login,
  )

  app.post<{ Body: RefreshBody }>(
    '/auth/refresh',
    { schema: refreshSchema },
    refresh,
  )

  app.post(
    '/auth/logout',
    { schema: logoutSchema, preHandler: app.authenticate },
    logout,
  )

  app.get(
    '/auth/me',
    { schema: meSchema, preHandler: app.authenticate },
    me,
  )
}
