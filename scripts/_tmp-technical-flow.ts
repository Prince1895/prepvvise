import 'dotenv/config'
import { connectToDatabase, PracticeSet } from '@/lib/db/client'

async function main() {
  await connectToDatabase()
  const count = await PracticeSet.countDocuments()
  console.log(`Technical flow test: ${count} practice sets in database.`)
}

main().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1) })
