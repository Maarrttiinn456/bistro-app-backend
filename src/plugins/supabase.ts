import type { FastifyInstance } from 'fastify'

type SupabaseAuthUser = {
  id: string
  email?: string | null
}

type SupabaseAuthSession = {
  accessToken: string | null
  refreshToken: string | null
  expiresIn: number | null
  tokenType: string | null
  user: SupabaseAuthUser | null
}

type SupabaseAuthErrorPayload = {
  error?: string
  error_description?: string
  msg?: string
  message?: string
}

type SupabaseAuthClient = {
  signUp: (input: { email: string, password: string, name: string }) => Promise<SupabaseAuthSession>
  login: (input: { email: string, password: string }) => Promise<SupabaseAuthSession>
  refresh: (refreshToken: string) => Promise<SupabaseAuthSession>
  logout: (accessToken: string) => Promise<void>
}

declare module 'fastify' {
  interface FastifyInstance {
    supabase: {
      auth: SupabaseAuthClient
    }
  }
}

export class SupabaseAuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message)
  }
}

const normalizeSupabaseUrl = (url: string) => url.replace(/\/$/, '')

const getErrorMessage = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return 'Supabase Auth request failed'
  }

  const error = payload as SupabaseAuthErrorPayload

  return error.error_description ?? error.msg ?? error.message ?? error.error ?? 'Supabase Auth request failed'
}

const readJsonResponse = async (response: Response) => {
  const text = await response.text()

  if (!text) {
    return null
  }

  return JSON.parse(text) as unknown
}

const mapSession = (payload: unknown): SupabaseAuthSession => {
  if (!payload || typeof payload !== 'object') {
    return {
      accessToken: null,
      refreshToken: null,
      expiresIn: null,
      tokenType: null,
      user: null,
    }
  }

  const data = payload as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    token_type?: string
    user?: SupabaseAuthUser
    id?: string
    email?: string | null
  }

  return {
    accessToken: data.access_token ?? null,
    refreshToken: data.refresh_token ?? null,
    expiresIn: data.expires_in ?? null,
    tokenType: data.token_type ?? null,
    user: data.user ?? (data.id ? { id: data.id, email: data.email ?? null } : null),
  }
}

export const registerSupabase = async (app: FastifyInstance) => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is required')
  }

  if (!supabaseAnonKey) {
    throw new Error('SUPABASE_ANON_KEY is required')
  }

  const authUrl = `${normalizeSupabaseUrl(supabaseUrl)}/auth/v1`

  const requestAuth = async (
    path: string,
    options: {
      method: 'GET' | 'POST'
      accessToken?: string
      body?: Record<string, unknown>
    },
  ) => {
    const response = await fetch(`${authUrl}${path}`, {
      method: options.method,
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${options.accessToken ?? supabaseAnonKey}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    const payload = await readJsonResponse(response)

    if (!response.ok) {
      throw new SupabaseAuthError(getErrorMessage(payload), response.status)
    }

    return payload
  }

  app.decorate('supabase', {
    auth: {
      signUp: async ({ email, password, name }) => mapSession(await requestAuth('/signup', {
        method: 'POST',
        body: {
          email,
          password,
          data: { name },
        },
      })),
      login: async ({ email, password }) => mapSession(await requestAuth('/token?grant_type=password', {
        method: 'POST',
        body: { email, password },
      })),
      refresh: async (refreshToken) => mapSession(await requestAuth('/token?grant_type=refresh_token', {
        method: 'POST',
        body: { refresh_token: refreshToken },
      })),
      logout: async (accessToken) => {
        await requestAuth('/logout', {
          method: 'POST',
          accessToken,
        })
      },
    },
  })
}
