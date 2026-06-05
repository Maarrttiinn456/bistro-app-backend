import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { createRemoteJWKSet, jwtVerify } from 'jose'

const DEMO_USER_ADAM_ID = '11111111-1111-4111-8111-111111111111'

type AuthUser = {
  id: string
  email: string | null
  role: string | null
}

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUser
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

const getBearerToken = (authorization: string | undefined) => {
  const [scheme, token] = authorization?.split(' ') ?? []

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null
  }

  return token
}

const getSupabaseIssuer = (supabaseUrl: string) => `${supabaseUrl.replace(/\/$/, '')}/auth/v1`

const sendUnauthorized = async (reply: FastifyReply) => reply.code(401).send({
  error: 'Unauthorized',
})

// TODO: Remove this dev auth bypass before production deployment.
const getDevUser = (token: string): AuthUser | null => {
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  const devAuthToken = process.env.DEV_AUTH_TOKEN

  if (!devAuthToken || token !== devAuthToken) {
    return null
  }

  return {
    id: process.env.DEV_AUTH_USER_ID ?? DEMO_USER_ADAM_ID,
    email: process.env.DEV_AUTH_EMAIL ?? 'adam.demo@example.com',
    role: 'authenticated',
  }
}

export const registerAuth = async (app: FastifyInstance) => {
  const supabaseUrl = process.env.SUPABASE_URL

  if (!supabaseUrl) {
    if (process.env.DEV_AUTH_TOKEN && process.env.NODE_ENV !== 'production') {
      app.decorate('authenticate', async (request, reply) => {
        const token = getBearerToken(request.headers.authorization)
        const devUser = token ? getDevUser(token) : null

        if (!devUser) {
          await sendUnauthorized(reply)
          return
        }

        request.user = devUser
      })
      return
    }

    throw new Error('SUPABASE_URL is required')
  }

  const issuer = getSupabaseIssuer(supabaseUrl)
  const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`))

  app.decorate('authenticate', async (request, reply) => {
    const token = getBearerToken(request.headers.authorization)

    if (!token) {
      await sendUnauthorized(reply)
      return
    }

    const devUser = getDevUser(token)

    if (devUser) {
      request.user = devUser
      return
    }

    try {
      const { payload } = await jwtVerify(token, jwks, { issuer })

      if (!payload.sub) {
        await sendUnauthorized(reply)
        return
      }

      request.user = {
        id: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : null,
        role: typeof payload.role === 'string' ? payload.role : null,
      }
    } catch {
      await sendUnauthorized(reply)
    }
  })
}
