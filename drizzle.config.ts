import 'dotenv/config'

export default {
  dialect: 'postgresql',
  schema: ['./lib/db/schema.ts'],
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
}
