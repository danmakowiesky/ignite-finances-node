import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {knex} from '../database'
import { randomUUID } from 'node:crypto'
import { checkIdSessionExists } from '../middleware/session-check-id'

export async function transactionsRoutes(app: FastifyInstance) {
  app.get('/', {preHandler:[checkIdSessionExists]}, async (request) => {
    const sessionId = request.cookies.sessionId
    const transactions = await knex('transactions').select('*').where('session_id', sessionId)
    return {transactions}
  })

  app.get('/summary', async (request) => {
    const sessionId = request.cookies.sessionId
    const summary = await knex('transactions').sum('ammount', {as: 'ammount'}).where('session_id', sessionId).first()
    return {summary}
  })

  app.get('/:id', {preHandler:[checkIdSessionExists]}, async (request) => {
    const getTransactionsParamsschema = z.object({
      id: z.string().uuid()
    })
    const {id} = getTransactionsParamsschema.parse(request.params)
    const sessionId = request.cookies.sessionId
    const transactions = await knex('transactions').where({session_id: sessionId, id}).first()
    return transactions
  })

  app.post('/', async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      ammount: z.number(),
      type: z.enum(['credit', 'debit']),
    })
    const { title, ammount, type } = createTransactionBodySchema.parse(
      request.body,
    )
    let sessionId = request.cookies.sessionId
    if(!sessionId){
      sessionId = randomUUID()
      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 30 //30days
      })
    }
    await knex('transactions').insert({
      id: randomUUID(),
      title,
      ammount: type === 'credit' ? ammount : ammount * -1,
      session_id: sessionId
    })
    return reply.status(201).send()
  })
}
