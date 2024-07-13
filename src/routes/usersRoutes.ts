import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import crypto, { randomUUID } from 'node:crypto'
import { knex } from '../database'
// import { checkSessionIdExists } from '../middleware/check-session-id-exists'

export async function userRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string(),
    })

    const { name, email } = createUserBodySchema.parse(request.body)

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
    }

    const userByEmail = await knex('users').where({ email }).first()

    if (userByEmail) {
      return reply.status(400).send({ message: 'User already exists' })
    }

    await knex('users').insert({
      id: crypto.randomUUID(),
      name,
      email,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })

  app.get('/', async (request, reply) => {
    const TotalUsers = await knex('users').select('*')

    return reply.status(200).send({ TotalUsers })
  })
}
