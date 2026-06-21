import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import type { FastifyInstance } from 'fastify'
import { openApiSchemas, schemaRef } from '../schemas/openapi'

type JsonObject = Record<string, unknown>

const nullableType = 'null'
const compositionKeys = ['oneOf', 'anyOf'] as const

const isJsonObject = (value: unknown): value is JsonObject => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const isNullSchema = (value: unknown) => isJsonObject(value) && value.type === nullableType

const normalizeOpenApiNullable = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(normalizeOpenApiNullable)
  }

  if (!isJsonObject(value)) {
    return value
  }

  const normalized = Object.fromEntries(
    Object.entries(value).map(([key, childValue]) => [key, normalizeOpenApiNullable(childValue)]),
  )

  if (Array.isArray(value.type) && value.type.includes(nullableType)) {
    const nonNullableTypes = value.type.filter((type) => type !== nullableType)

    normalized.nullable = true

    if (nonNullableTypes.length === 1) {
      normalized.type = nonNullableTypes[0]
    } else if (nonNullableTypes.length > 1) {
      delete normalized.type
      normalized.oneOf = nonNullableTypes.map((type) => ({ type }))
    } else {
      delete normalized.type
    }
  }

  if (Array.isArray(normalized.required) && normalized.required.length === 0) {
    delete normalized.required
  }

  for (const key of compositionKeys) {
    const options = normalized[key]

    if (!Array.isArray(options) || !options.some(isNullSchema)) {
      continue
    }

    const nonNullOptions = options.filter((option) => !isNullSchema(option))
    normalized.nullable = true

    if (nonNullOptions.length === 1 && isJsonObject(nonNullOptions[0])) {
      const [nonNullOption] = nonNullOptions

      delete normalized[key]

      if (typeof nonNullOption.$ref === 'string') {
        normalized.allOf = [nonNullOption]
        normalized.nullable = true
        continue
      }

      Object.assign(normalized, nonNullOption, { nullable: true })
      continue
    }

    normalized[key] = nonNullOptions
  }

  return normalized
}

export const registerSwagger = async (app: FastifyInstance) => {
  await app.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Bistro App Backend API',
        description: 'OpenAPI contract for generated frontend API clients.',
        version: '0.1.0',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Local development server',
        },
      ],
      tags: [
        {
          name: 'System',
          description: 'System and API contract endpoints',
        },
        {
          name: 'Recipes',
          description: 'Recipe endpoints',
        },
      ],
    },
    transformObject: (documentObject) => {
      if ('openapiObject' in documentObject) {
        return normalizeOpenApiNullable(documentObject.openapiObject) as typeof documentObject.openapiObject
      }

      return documentObject.swaggerObject
    },
    refResolver: {
      buildLocalReference: (json, _baseUri, _fragment, index) => (
        isJsonObject(json) && typeof json.$id === 'string' ? json.$id : `def-${index}`
      ),
    },
  })

  for (const schema of openApiSchemas) {
    app.addSchema(schema)
  }

  app.get('/openapi.json', {
    schema: {
      tags: ['System'],
      summary: 'Get OpenAPI specification',
      operationId: 'getOpenApiSpec',
      response: {
        200: schemaRef('OpenApiSpec'),
      },
    },
  }, async () => app.swagger())

  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  })
}
