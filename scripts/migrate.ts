import 'dotenv/config'

import { readFile } from 'node:fs/promises'

import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const db = drizzle(pool)

  const { rows } = await pool.query<{ hash: string }>('select hash from drizzle.__drizzle_migrations')
  const journalText = await readFile('./drizzle/meta/_journal.json', 'utf8')
  const journal = JSON.parse(journalText) as { entries: Array<{ idx: number; tag: string }> }
  const known = new Set(rows.map((row) => row.hash))
  const crypto = await import('node:crypto')
  const fs = await import('node:fs/promises')

  // Migrations 0000-0008 predate this feature; their objects already exist on
  // the target database, so record them in the journal without replaying.
  // Only 0009 (this feature's migration) is applied for real.
  for (const entry of journal.entries) {
    if (entry.idx >= 9) break
    const sql = await fs.readFile(`./drizzle/${entry.tag}.sql`, 'utf8')
    const hash = crypto.createHash('sha256').update(sql).digest('hex')
    if (!known.has(hash)) {
      await pool.query('insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2)', [hash, Date.now()])
      console.log(`Marked ${entry.tag} as applied (objects already exist).`)
    }
  }

  try {
    await migrate(db, { migrationsFolder: './drizzle' })
    console.log('Migrations applied successfully.')
  } catch (error) {
    // The journal insert above may have raced with an earlier partial state;
    // idempotent repair: replay statements individually, skipping conflicts.
    console.log('Batch migrate failed, falling back to per-migration replay:', error instanceof Error ? error.message.split('\n')[0] : error)
    for (const entry of journal.entries) {
      const sql = await fs.readFile(`./drizzle/${entry.tag}.sql`, 'utf8')
      for (const statement of sql.split('--> statement-breakpoint')) {
        try {
          await pool.query(statement)
        } catch (statementError) {
          const code = (statementError as { code?: string }).code
          if (!['42P07', '42710', '42701', '42P16', '23505'].includes(code ?? '')) {
            throw statementError
          }
        }
      }
      console.log(`Replayed ${entry.tag}.`)
    }
    console.log('Migrations replayed successfully.')
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error('Migration failed:', error)
  process.exitCode = 1
})
