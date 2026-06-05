import { eq } from 'drizzle-orm'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { db } from '../db/client'
import { householdMembers, households, profiles } from '../db/schema'
import { SupabaseAuthError } from '../plugins/supabase'
import type { LoginBody, RefreshBody, SignUpBody } from '../schemas/auth.schema'

type AuthContextInput = {
  user: {
    id: string
    email?: string | null
  }
  session: {
    accessToken: string | null
    refreshToken: string | null
    expiresIn: number | null
    tokenType: string | null
  }
}

// Vytahne access token z Authorization hlavicky ve formatu Bearer token.
const getBearerToken = (authorization: string | undefined) => {
  const [scheme, token] = authorization?.split(' ') ?? []

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null
  }

  return token
}

// Prevede chybu ze Supabase Auth na HTTP odpoved.
const sendAuthError = async (reply: FastifyReply, error: unknown) => {
  if (error instanceof SupabaseAuthError) {
    await reply.code(error.statusCode).send({ error: error.message })
    return
  }

  await reply.code(500).send({ error: 'Auth request failed' })
}

// Slozi prihlaseny uzivatelsky kontext vcetne profilu a domacnosti.
const getUserContext = async ({ user, session }: AuthContextInput) => {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1)

  if (!profile) {
    return null
  }

  const memberships = await db
    .select({
      householdId: householdMembers.householdId,
      userId: householdMembers.userId,
      role: householdMembers.role,
      joinedAt: householdMembers.joinedAt,
      household: households,
    })
    .from(householdMembers)
    .innerJoin(households, eq(households.id, householdMembers.householdId))
    .where(eq(householdMembers.userId, user.id))

  const activeMembership = memberships.find((membership) => membership.householdId === profile.activeHouseholdId)

  return {
    user: {
      id: user.id,
      email: user.email ?? profile.email,
    },
    session,
    profile,
    activeHousehold: activeMembership?.household ?? null,
    households: memberships,
  }
}

// Vraci chybu, kdyz Auth uzivatel nema odpovidajici profil.
const sendMissingProfile = async (reply: FastifyReply) => reply.code(500).send({
  error: 'Profile is missing for authenticated user',
})

// Vraci chybu, kdyz Supabase Auth odpoved neobsahuje uzivatele.
const sendMissingAuthUser = async (reply: FastifyReply) => reply.code(500).send({
  error: 'Supabase Auth response is missing user',
})

/*
 * POST /auth/signup
 * Zaregistruje uzivatele pres Supabase Auth a vrati jeho profil.
 */
export const signUp = async (
  request: FastifyRequest<{ Body: SignUpBody }>,
  reply: FastifyReply,
) => {
  try {
    const authSession = await request.server.supabase.auth.signUp(request.body)

    if (!authSession.user) {
      await sendMissingAuthUser(reply)
      return
    }

    const context = await getUserContext({
      user: authSession.user,
      session: {
        accessToken: authSession.accessToken,
        refreshToken: authSession.refreshToken,
        expiresIn: authSession.expiresIn,
        tokenType: authSession.tokenType,
      },
    })

    if (!context) {
      await sendMissingProfile(reply)
      return
    }

    return reply.code(201).send(context)
  } catch (error) {
    await sendAuthError(reply, error)
  }
}

/*
 * POST /auth/login
 * Prihlasi uzivatele pres Supabase Auth a vrati session plus profil.
 */
export const login = async (
  request: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply,
) => {
  try {
    const authSession = await request.server.supabase.auth.login(request.body)

    if (!authSession.user) {
      await sendMissingAuthUser(reply)
      return
    }

    const context = await getUserContext({
      user: authSession.user,
      session: {
        accessToken: authSession.accessToken,
        refreshToken: authSession.refreshToken,
        expiresIn: authSession.expiresIn,
        tokenType: authSession.tokenType,
      },
    })

    if (!context) {
      await sendMissingProfile(reply)
      return
    }

    return context
  } catch (error) {
    await sendAuthError(reply, error)
  }
}

/*
 * POST /auth/refresh
 * Vymeni refresh token za novou Supabase session.
 */
export const refresh = async (
  request: FastifyRequest<{ Body: RefreshBody }>,
  reply: FastifyReply,
) => {
  try {
    const authSession = await request.server.supabase.auth.refresh(request.body.refreshToken)

    if (!authSession.user) {
      await sendMissingAuthUser(reply)
      return
    }

    const context = await getUserContext({
      user: authSession.user,
      session: {
        accessToken: authSession.accessToken,
        refreshToken: authSession.refreshToken,
        expiresIn: authSession.expiresIn,
        tokenType: authSession.tokenType,
      },
    })

    if (!context) {
      await sendMissingProfile(reply)
      return
    }

    return context
  } catch (error) {
    await sendAuthError(reply, error)
  }
}

/*
 * POST /auth/logout
 * Odhlasi aktualni Supabase session podle access tokenu.
 */
export const logout = async (request: FastifyRequest, reply: FastifyReply) => {
  const accessToken = getBearerToken(request.headers.authorization)

  if (!accessToken) {
    return reply.code(401).send({ error: 'Unauthorized' })
  }

  try {
    await request.server.supabase.auth.logout(accessToken)

    return { success: true }
  } catch (error) {
    await sendAuthError(reply, error)
  }
}

/*
 * GET /auth/me
 * Vrati aktualniho uzivatele, profil a jeho domacnosti.
 */
export const me = async (request: FastifyRequest, reply: FastifyReply) => {
  const context = await getUserContext({
    user: request.user,
    session: {
      accessToken: null,
      refreshToken: null,
      expiresIn: null,
      tokenType: null,
    },
  })

  if (!context) {
    return reply.code(404).send({ error: 'Profile not found' })
  }

  return context
}
