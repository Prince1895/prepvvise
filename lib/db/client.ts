import { connectToDatabase } from '@/lib/db/mongodb'
import * as models from '@/lib/db/models'

export async function getDb() {
  await connectToDatabase()
  return models
}

export { connectToDatabase }
export * from '@/lib/db/models'
