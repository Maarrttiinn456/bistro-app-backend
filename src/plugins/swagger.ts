import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import type { FastifyInstance } from 'fastify'

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
          name: 'Recipes',
          description: 'Recipe endpoints',
        },
      ],
    },
  })

  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  })
}
