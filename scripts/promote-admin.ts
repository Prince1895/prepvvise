import 'dotenv/config'
import { connectToDatabase, User } from '@/lib/db/client'

async function main() {
  const raw = process.argv[2] ?? process.env.ADMIN_EMAIL ?? 'chauhanprince21153366@gmail.com'
  const email = String(raw).trim().toLowerCase()
  if (!email) throw new Error('Provide email')

  await connectToDatabase()
  const user = await User.findOneAndUpdate(
    { email: email },
    { role: 'admin' },
    { new: true }
  ).lean()

  if (!user) {
    console.log(`No user found with email ${email}`)
  } else {
    console.log(`Promoted user ${user.id} (${user.email}) to admin.`)
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
