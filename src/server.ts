import 'dotenv/config'
import Fastify from 'fastify'
import { registerAuth } from './plugins/auth'
import { registerSupabase } from './plugins/supabase'
import { registerSwagger } from './plugins/swagger'
import { authRoutes } from './routes/auth.routes'
import { foodLogRoutes } from './routes/food-log.routes'
import { ingredientRoutes } from './routes/ingredients.routes'
import { mealPlanRoutes } from './routes/meal-plan.routes'
import { overviewRoutes } from './routes/overview.routes'
import { profileRoutes } from './routes/profile.routes'
import { recipeRoutes } from './routes/recipes.routes'

const app = Fastify({ logger: true })

const start = async () => {
  await registerSwagger(app)
  await registerSupabase(app)
  await registerAuth(app)
  await app.register(authRoutes, { prefix: '/v1' })
  await app.register(profileRoutes, { prefix: '/v1' })
  await app.register(ingredientRoutes, { prefix: '/v1' })
  await app.register(recipeRoutes, { prefix: '/v1' })
  await app.register(mealPlanRoutes, { prefix: '/v1' })
  await app.register(foodLogRoutes, { prefix: '/v1' })
  await app.register(overviewRoutes, { prefix: '/v1' })

  try {
    const address = await app.listen({ port: 3000 })
    app.log.info(`Server is now listening on ${address}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
