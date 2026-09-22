import { z } from 'zod'

import { generateAssistance } from '@/lib/ai/provider'
import { requireCurrentAppUser } from '@/lib/auth/current-user'
import {
  connectToDatabase,
  AIAnalysis,
  AIUsage,
  AssessmentAttempt,
  PracticeSet,
  AssessmentModule,
  AttemptAnswer,
} from '@/lib/db/client'
import { getPlanEntitlements } from '@/lib/services/plans'

export const analysisSchema = z.object({
  attemptId: z.string(),
})

export class AnalysisServiceError extends Error {
  constructor(public readonly status: 400 | 403 | 404 | 409 | 429 | 502, message: string) {
    super(message)
  }
}

function startOfUtcDay() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

const analysisResponseSchema = z.object({
  summary: z.string().min(1),
  strengths: z.array(z.string()).default([]),
  focusAreas: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
})

function parseAnalysis(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i)?.[1] ?? text
  const start = fenced.indexOf('{')
  const end = fenced.lastIndexOf('}')
  const candidate = start >= 0 && end > start ? fenced.slice(start, end + 1) : fenced
  try {
    const parsed = analysisResponseSchema.safeParse(JSON.parse(candidate))
    if (parsed.success) return parsed.data
  } catch {
    // fall through
  }
  const summary = text.trim().slice(0, 600) || 'Attempt recorded. Review incorrect answers and retry weak topics.'
  return { summary, strengths: [], focusAreas: [], recommendations: [] }
}

export async function generateAttemptAnalysis(input: z.infer<typeof analysisSchema>) {
  const user = await requireCurrentAppUser()
  await connectToDatabase()

  const attemptDoc = await AssessmentAttempt.findOne({ _id: input.attemptId, userId: user.id }).lean()
  if (!attemptDoc) throw new AnalysisServiceError(404, 'Attempt not found.')
  if (attemptDoc.status !== 'submitted') throw new AnalysisServiceError(409, 'Analysis is available after submission.')

  const setDoc = await PracticeSet.findById(attemptDoc.practiceSetId).lean()
  const modDoc = setDoc ? await AssessmentModule.findById(setDoc.moduleId).lean() : null

  const attempt = {
    id: String(attemptDoc._id),
    status: attemptDoc.status,
    score: attemptDoc.score,
    result: attemptDoc.result,
    setName: setDoc?.name || '',
    moduleName: modDoc?.name || '',
  }

  const existing = await AIAnalysis.findOne({ attemptId: attempt.id, feature: 'attempt_analysis' }).lean()
  if (existing) return { ...existing, id: String(existing._id), reused: true }

  const plan = await getPlanEntitlements(user.plan)

  if (!plan.aiAnalysis) {
    throw new AnalysisServiceError(403, 'AI analysis is available on premium plans. Upgrade to unlock it.')
  }

  const dailyLimit = plan.aiAnalysisDailyLimit
  if (dailyLimit !== null) {
    const usageDocs = await AIUsage.find({
      userId: user.id,
      feature: 'attempt_analysis',
      usageDate: { $gte: startOfUtcDay() },
    }).lean()

    const requestCount = usageDocs.reduce((acc, doc) => acc + (doc.requestCount || 0), 0)

    if (requestCount >= dailyLimit) {
      throw new AnalysisServiceError(429, `Daily analysis limit reached (${dailyLimit}/day on the ${plan.displayName} plan).`)
    }
  }

  const answerCount = await AttemptAnswer.countDocuments({ attemptId: attempt.id })

  const generated = await generateAssistance({
    problem: `Analyze the completed ${attempt.moduleName} assessment, practice set ${attempt.setName}.`,
    currentCode: '',
    context: JSON.stringify({ score: attempt.score, result: attempt.result, answeredQuestions: answerCount }),
    request: 'Return only JSON with keys summary, strengths, focusAreas, and recommendations. Each list must contain concise strings.',
  })

  const analysis = parseAnalysis(generated.text)
  const record = await AIAnalysis.create({
    userId: user.id,
    attemptId: attempt.id,
    feature: 'attempt_analysis',
    ...analysis,
    inputTokens: generated.inputTokens,
    outputTokens: generated.outputTokens,
  })

  await AIUsage.create({
    userId: user.id,
    feature: 'attempt_analysis',
    requestCount: 1,
    inputTokens: generated.inputTokens,
    outputTokens: generated.outputTokens,
  })

  const recordObj = record.toObject()
  return { ...recordObj, id: String(recordObj._id), reused: false }
}
