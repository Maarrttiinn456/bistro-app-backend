import type { FastifyInstance } from 'fastify'
import { getProfile, updateProfile } from '../controllers/profile.controller'
import {
  type UpdateProfileBody,
  getProfileSchema,
  updateProfileSchema,
} from '../schemas/profile.schema'

export const profileRoutes = async (app: FastifyInstance) => {
  app.get(
    '/profile/me',
    { schema: getProfileSchema, preHandler: app.authenticate },
    getProfile,
  )

  app.patch<{ Body: UpdateProfileBody }>(
    '/profile/me',
    { schema: updateProfileSchema, preHandler: app.authenticate },
    updateProfile,
  )
}
