import { eq } from 'drizzle-orm'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { db } from '../db/client'
import { profiles } from '../db/schema'
import type { UpdateProfileBody } from '../schemas/profile.schema'

// Vraci chybu, kdyz profil prihlaseneho uzivatele neexistuje.
const sendNotFound = async (reply: FastifyReply) => reply.code(404).send({
  error: 'Profile not found',
})

// Bali profil do jednotneho response tvaru API.
const toProfileResponse = (profile: typeof profiles.$inferSelect) => ({
  profile,
})

/*
 * GET /profile/me
 * Vraci profil prihlaseneho uzivatele.
 */
export const getProfile = async (request: FastifyRequest, reply: FastifyReply) => {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, request.user.id))
    .limit(1)

  if (!profile) {
    await sendNotFound(reply)
    return
  }

  return toProfileResponse(profile)
}

/*
 * PATCH /profile/me
 * Upravi zakladni profil a cilove hodnoty prihlaseneho uzivatele.
 */
export const updateProfile = async (
  request: FastifyRequest<{ Body: UpdateProfileBody }>,
  reply: FastifyReply,
) => {
  const body = request.body

  const updateData = {
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl } : {}),
    ...(body.aiNotes !== undefined ? { aiNotes: body.aiNotes } : {}),
    ...(body.goalKcal !== undefined ? { goalKcal: body.goalKcal } : {}),
    ...(body.goalProtein !== undefined ? { goalProtein: body.goalProtein } : {}),
    ...(body.goalCarbs !== undefined ? { goalCarbs: body.goalCarbs } : {}),
    ...(body.goalFat !== undefined ? { goalFat: body.goalFat } : {}),
  }

  if (Object.keys(updateData).length === 0) {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, request.user.id))
      .limit(1)

    if (!profile) {
      await sendNotFound(reply)
      return
    }

    return toProfileResponse(profile)
  }

  const [profile] = await db
    .update(profiles)
    .set(updateData)
    .where(eq(profiles.id, request.user.id))
    .returning()

  if (!profile) {
    await sendNotFound(reply)
    return
  }

  return toProfileResponse(profile)
}
