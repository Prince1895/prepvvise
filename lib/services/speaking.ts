import { z } from 'zod'

import { generateAssistance } from '@/lib/ai/provider'
import { requireCurrentAppUser } from '@/lib/auth/current-user'
import {
  connectToDatabase,
  SpeakingSubmission,
  AIUsage,
} from '@/lib/db/client'
import { getPlanEntitlements } from '@/lib/services/plans'

const MAX_AUDIO_BYTES = 8 * 1024 * 1024
const FREE_DAILY_SPEAKING_LIMIT = 5
const PREMIUM_DAILY_SPEAKING_LIMIT = 50

export const speakingSubmissionSchema = z.object({
  prompt: z.string().trim().min(1).max(4000),
  questionId: z.string().nullable().optional(),
  attemptId: z.string().nullable().optional(),
  audioDataUrl: z.string().max(MAX_AUDIO_BYTES),
  audioMimeType: z.string().trim().max(120).default('audio/webm'),
  durationSeconds: z.number().int().min(0).max(3600).default(0),
})

export class SpeakingServiceError extends Error {
  constructor(public readonly status: 400 | 403 | 404 | 429 | 502, message: string) {
    super(message)
  }
}

function startOfUtcDay() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

const speakingFeedbackSchema = z.object({
  summary: z.string().min(1),
  clarity: z.number().min(0).max(10).nullable().optional(),
  fluency: z.number().min(0).max(10).nullable().optional(),
  vocabulary: z.number().min(0).max(10).nullable().optional(),
  grammar: z.number().min(0).max(10).nullable().optional(),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
})

function parseSpeakingFeedback(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i)?.[1] ?? text
  const start = fenced.indexOf('{')
  const end = fenced.lastIndexOf('}')
  const candidate = start >= 0 && end > start ? fenced.slice(start, end + 1) : fenced
  try {
    const parsed = speakingFeedbackSchema.safeParse(JSON.parse(candidate))
    if (parsed.success) return parsed.data
  } catch {
    // fall through
  }
  return {
    summary: text.trim().slice(0, 800) || 'Speaking response recorded. AI feedback is currently unavailable — try again later.',
    strengths: [],
    improvements: [],
  }
}

export async function submitSpeakingResponse(input: z.infer<typeof speakingSubmissionSchema>) {
  const user = await requireCurrentAppUser()
  await connectToDatabase()

  const plan = await getPlanEntitlements(user.plan)

  const usageDocs = await AIUsage.find({
    userId: user.id,
    feature: 'speaking_feedback',
    usageDate: { $gte: startOfUtcDay() },
  }).lean()

  const used = usageDocs.reduce((acc, doc) => acc + (doc.requestCount || 0), 0)
  const dailyLimit = plan.aiCoachDailyLimit ?? (user.plan === 'premium' ? PREMIUM_DAILY_SPEAKING_LIMIT : FREE_DAILY_SPEAKING_LIMIT)

  const submission = await SpeakingSubmission.create({
    userId: user.id,
    attemptId: input.attemptId ?? null,
    questionId: input.questionId ?? null,
    prompt: input.prompt,
    audioDataUrl: input.audioDataUrl,
    audioMimeType: input.audioMimeType,
    durationSeconds: input.durationSeconds,
  })

  if (used >= dailyLimit) {
    return {
      submission: { id: String(submission._id), status: 'recorded' as const },
      feedback: null,
      usage: { dailyLimit, used, limitReached: true },
      message: `Daily speaking feedback limit reached (${dailyLimit}/day). Your recording is saved; feedback resumes tomorrow.`,
    }
  }

  const generated = await generateAssistance({
    problem: `Evaluate a spoken English response for the IELTS/TOEFL speaking prompt: "${input.prompt}". The response lasted ${input.durationSeconds} seconds.`,
    currentCode: '',
    context: 'Speaking practice feedback. Respond with JSON only.',
    request: 'Return only JSON with keys: summary (string), clarity, fluency, vocabulary, grammar (0-10 numbers or null), strengths (string[]), improvements (string[]).',
  })

  const feedback = parseSpeakingFeedback(generated.text)
  const updated = await SpeakingSubmission.findByIdAndUpdate(
    submission._id,
    {
      status: 'analyzed',
      feedback,
      transcript: feedback.summary.slice(0, 4000),
      updatedAt: new Date(),
    },
    { returnDocument: 'after' }
  ).lean()

  await AIUsage.create({
    userId: user.id,
    feature: 'speaking_feedback',
    requestCount: 1,
    inputTokens: generated.inputTokens,
    outputTokens: generated.outputTokens,
  })

  return {
    submission: { id: String(updated?._id), status: updated?.status },
    feedback,
    usage: { dailyLimit, used: used + 1, limitReached: false },
  }
}

export async function listSpeakingSubmissions(limit = 20) {
  const user = await requireCurrentAppUser()
  await connectToDatabase()

  const rows = await SpeakingSubmission.find({ userId: user.id }).sort({ createdAt: -1 }).limit(limit).lean()

  return rows.map((r) => ({
    id: String(r._id),
    prompt: r.prompt,
    status: r.status,
    durationSeconds: r.durationSeconds,
    feedback: r.feedback,
    createdAt: r.createdAt,
  }))
}
