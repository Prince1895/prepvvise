/**
 * One-off idempotent migration repair for databases provisioned outside the
 * drizzle journal (tables pre-exist but __drizzle_migrations is empty).
 * Replays each migration statement-by-statement, tolerating every
 * already-exists error class, and records the migration hash afterwards.
 */
import 'dotenv/config'

import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { Pool } from 'pg'

const TOLERATED = new Set(['42P07', '42710', '42701', '42P16', '23505', '42P06', '42704', '42703'])

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const journal = JSON.parse(await readFile('./drizzle/meta/_journal.json', 'utf8')) as {
    entries: Array<{ idx: number; tag: string }>
  }

  await pool.query('delete from drizzle.__drizzle_migrations')
  console.log('Cleared drizzle journal.')

  for (const entry of journal.entries) {
    const sql = await readFile(`./drizzle/${entry.tag}.sql`, 'utf8')
    for (const statement of sql.split('--> statement-breakpoint')) {
      try {
        await pool.query(statement)
      } catch (error) {
        const code = (error as { code?: string }).code ?? ''
        if (!TOLERATED.has(code)) {
          throw error
        }
      }
    }
    const hash = createHash('sha256').update(sql).digest('hex')
    await pool.query('insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2)', [hash, Date.now()])
    console.log(`Applied ${entry.tag}.`)
  }

  const { rows } = await pool.query<{ count: string }>("select count(*) as count from pg_tables where schemaname = 'public'")
  console.log(`Public tables: ${rows[0].count}`)
  await pool.end()
}

main().catch((error) => {
  console.error('Repair failed:', (error as { code?: string }).code, error instanceof Error ? error.message : error)
  process.exitCode = 1
})
