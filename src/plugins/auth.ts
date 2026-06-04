import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { createRemoteJWKSet, jwtVerify } from 'jose'

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

export const registerAuth = async (app: FastifyInstance) => {
  const supabaseUrl = process.env.SUPABASE_URL

  if (!supabaseUrl) {
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
