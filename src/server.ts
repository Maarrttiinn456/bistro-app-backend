import Fastify from 'fastify'
import { registerAuth } from './plugins/auth'
import { registerSwagger } from './plugins/swagger'
import { recipeRoutes } from './routes/recipes.routes'

const app = Fastify({ logger: true })

const start = async () => {
  await registerSwagger(app)
  await registerAuth(app)
  await app.register(recipeRoutes, { prefix: '/v1' })

  try {
    const address = await app.listen({ port: 3000 })
    app.log.info(`Server is now listening on ${address}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
