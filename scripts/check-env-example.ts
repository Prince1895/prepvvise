import { readFileSync } from 'node:fs'

const requiredKeys = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'CLERK_WEBHOOK_SIGNING_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'EXECUTION_SERVICE_URL',
  'EXECUTION_SERVICE_TOKEN',
  'GROQ_API_KEY',
  'GEMINI_API_KEY',
  'DATABASE_URL',
]

const secretKeys = requiredKeys.filter((key) => !key.startsWith('NEXT_PUBLIC_') && key !== 'DATABASE_URL' && key !== 'EXECUTION_SERVICE_URL')
const contents = readFileSync('.env.example', 'utf8')
const values = new Map<string, string>()

for (const line of contents.split(/\r?\n/)) {
  const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/)
  if (!match) continue
  values.set(match[1], match[2].trim().replace(/^['"]|['"]$/g, ''))
}

const missing = requiredKeys.filter((key) => !values.has(key))
const populatedSecrets = secretKeys.filter((key) => values.get(key))

if (missing.length > 0 || populatedSecrets.length > 0) {
  throw new Error([
    missing.length > 0 ? `Missing keys: ${missing.join(', ')}` : '',
    populatedSecrets.length > 0 ? `Secrets must be blank: ${populatedSecrets.join(', ')}` : '',
  ].filter(Boolean).join('\n'))
}

console.log('Environment template is complete and contains no populated secrets.')