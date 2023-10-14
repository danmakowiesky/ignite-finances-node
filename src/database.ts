import { knex as setupKnext, Knex } from 'knex'
import { env } from './env'

if (!process.env.DATABASE_URL) throw new Error('Database empty')

export const config: Knex.Config = {
  client: 'sqlite3',
  connection: {
    filename: env.DATABASE_URL,
  },
  useNullAsDefault: true,
  migrations: {
    extension: 'ts',
    directory: 'db/migrations',
  },
}
export const knex = setupKnext(config)
