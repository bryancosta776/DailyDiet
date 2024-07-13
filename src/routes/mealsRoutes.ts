import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { knex } from '../database'
import { checkSessionIdExists } from '../middleware/check-session-id-exists'

export async function mealsRoutes(app: FastifyInstance) {
  // rota para criar uma refeição
  app.post(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const mealsBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        IsOnDiet: z.boolean(),
        date: z.coerce.date(),
        userId: z.string(),
      })

      const { name, description, IsOnDiet, date, userId } =
        mealsBodySchema.parse(request.body)

      await knex('meals').insert({
        id: randomUUID(),
        name,
        description,
        is_on_diet: IsOnDiet,
        date: date.getTime(),
        user_id: userId,
      })

      return reply.status(201).send()
    },
  )

  // rota para pegar a refeição conforme o cookie do usuário criado
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const mealsRoutes = await knex('meals').where({
        user_id: sessionId,
      })

      return reply.status(200).send({ mealsRoutes })
    },
  )

  app.get(
    '/:idMeal',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getMealsParamsSchema = z.object({
        idMeal: z.string().uuid(),
      })

      const { idMeal } = getMealsParamsSchema.parse(request.params)

      if (!idMeal) {
        return reply.send({ message: 'Meal not Found' })
      }

      const mealsRoutes = await knex('meals').where({ id: idMeal }).first()

      return reply.status(200).send({ mealsRoutes })
    },
  )

  app.put(
    '/:mealId',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      try {
        const paramsSchema = z.object({ mealId: z.string().uuid() })

        const { mealId } = paramsSchema.parse(request.params)

        const updateMealBodySchema = z.object({
          name: z.string(),
          description: z.string(),
          IsOnDiet: z.boolean(),
          date: z.coerce.date(),
        })

        const { name, description, IsOnDiet, date } =
          updateMealBodySchema.parse(request.body)

        await knex('meals').where({ id: mealId }).update({
          name,
          description,
          is_on_diet: IsOnDiet,
          date: date.getTime(),
        })

        return reply.status(204).send()
      } catch (error) {
        return reply.send({ message: error })
      }
    },
  )

  app.delete(
    '/:idDeleteMeal',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      try {
        const idDelete = z.object({
          idDeleteMeal: z.string(),
        })

        const { idDeleteMeal } = idDelete.parse(request.params)

        await knex('meals').delete(idDeleteMeal)

        return reply.status(204).send({ DeleteMeals: 'Meal deleted ' })
      } catch (error) {
        return reply.send({ error })
      }
    },
  )

  app.get(
    '/metricsId',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const mealsRoutes = await knex('meals').where({
        user_id: sessionId,
      })

      const totalMealsOffDiet = await knex('meals').where({
        user_id: sessionId,
        is_on_diet: false,
      })

      const totalMealsOnDiet = await knex('meals').where({
        user_id: sessionId,
        is_on_diet: true,
      })

      return reply.send({
        total: mealsRoutes.length,
        totalMealsOffDiet: totalMealsOffDiet.length,
        totalMealsOnDiet: totalMealsOnDiet.length,
      })
    },
  )
}
