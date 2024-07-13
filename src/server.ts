import fastify from 'fastify'
import cookie from '@fastify/cookie'

import { env } from './env'
import { userRoutes } from './routes/usersRoutes'
import { mealsRoutes } from './routes/mealsRoutes'

export const app = fastify()

app.register(cookie)
app.register(userRoutes, {
  prefix: 'users',
})
app.register(mealsRoutes, {
  prefix: 'meals',
})

app
  .listen({
    port: env.PORT,
  })
  .then(() => {
    console.log('HTTP Server Running!')
  })
