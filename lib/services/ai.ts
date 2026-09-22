import { z } from 'zod'

import { generateAssistance } from '@/lib/ai/provider'
import { requireCurrentAppUser } from '@/lib/auth/current-user'
import { connectToDatabase, AIUsage } from '@/lib/db/client'
import { getPlanEntitlements } from '@/lib/services/plans'

const MAX_FIELD_LENGTH = 20_000
const FREE_DAILY_REQUEST_LIMIT = 10
const PREMIUM_DAILY_REQUEST_LIMIT = 100

export const aiAssistSchema = z.object({
  problem: z.string().trim().min(1).max(MAX_FIELD_LENGTH),
  currentCode: z.string().max(MAX_FIELD_LENGTH),
  context: z.string().max(MAX_FIELD_LENGTH).optional(),
  testOutput: z.string().max(MAX_FIELD_LENGTH).optional(),
  request: z.string().trim().min(1).max(4_000),
})

export class AiServiceError extends Error {
  constructor(public readonly status: 400 | 429 | 502, message: string) {
    super(message)
  }
}

function startOfUtcDay() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

export async function assistWithCoding(input: z.infer<typeof aiAssistSchema>) {
  const user = await requireCurrentAppUser()
  await connectToDatabase()

  const plan = await getPlanEntitlements(user.plan)
  const dailyLimit = plan.aiCoachDailyLimit ?? (user.plan === 'premium' ? PREMIUM_DAILY_REQUEST_LIMIT : FREE_DAILY_REQUEST_LIMIT)

  const usageDocs = await AIUsage.find({
    userId: user.id,
    feature: 'ai_coding_assist',
    usageDate: { $gte: startOfUtcDay() },
  }).lean()

  const requestCount = usageDocs.reduce((acc, doc) => acc + (doc.requestCount || 0), 0)

  if (requestCount >= dailyLimit) {
    throw new AiServiceError(429, 'Daily AI assistance limit reached.')
  }

  const result = await generateAssistance(input)

  await AIUsage.create({
    userId: user.id,
    feature: 'ai_coding_assist',
    requestCount: 1,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  })

  return {
    text: result.text,
    usage: {
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      dailyLimit,
      dailyRequestsUsed: requestCount + 1,
    },
  }
}
