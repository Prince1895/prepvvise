import { z } from 'zod'

import { requireCurrentAppUser } from '@/lib/auth/current-user'
import {
  connectToDatabase,
  AssessmentAttempt,
  PracticeSet,
  AssessmentModule,
  Question,
  AttemptAnswer,
} from '@/lib/db/client'
import { evaluateAttemptLimit, evaluateSetAccess, getPlanEntitlements } from '@/lib/services/plans'
import { recordProgress } from '@/lib/services/progress'
import { scoreAttempt } from '@/lib/services/scoring'

export const createAttemptSchema = z.object({
  practiceSetId: z.string(),
})

export const answerSchema = z.object({
  questionId: z.string(),
  answer: z.record(z.string(), z.unknown()),
})

export class AttemptServiceError extends Error {
  constructor(public readonly status: 403 | 404 | 409, message: string) {
    super(message)
  }
}

async function getOwnedAttempt(userId: string, attemptId: string) {
  await connectToDatabase()
  const doc = await AssessmentAttempt.findOne({ _id: attemptId, userId }).lean()
  if (!doc) return null
  return {
    id: String(doc._id),
    userId: String(doc.userId),
    practiceSetId: String(doc.practiceSetId),
    status: doc.status,
    startedAt: doc.startedAt,
    expiresAt: doc.expiresAt,
    submittedAt: doc.submittedAt,
    score: doc.score,
    result: doc.result,
  }
}

function isExpired(expiresAt: Date, now = new Date()) {
  return now.getTime() >= expiresAt.getTime()
}

export async function createAttempt(input: z.infer<typeof createAttemptSchema>) {
  const user = await requireCurrentAppUser()
  await connectToDatabase()

  const setDoc = await PracticeSet.findById(input.practiceSetId).lean()
  if (!setDoc || setDoc.status === 'draft') {
    throw new AttemptServiceError(404, 'Practice set not found.')
  }

  const modDoc = await AssessmentModule.findById(setDoc.moduleId).lean()

  const plan = await getPlanEntitlements(user.plan)
  const access = await evaluateSetAccess(user.id, plan, { access: setDoc.access, type: setDoc.type })

  if (!access.allowed) {
    const categoryLabel = access.category === 'mock' ? 'mock test' : access.category === 'daily' ? 'daily assessment' : 'practice set'
    throw new AttemptServiceError(403, `Your ${plan.displayName} plan allows ${access.limit} ${categoryLabel}${access.limit === 1 ? '' : 's'}. Upgrade to premium for full access.`)
  }

  const set = { id: String(setDoc._id), access: setDoc.access, type: setDoc.type, status: setDoc.status, attemptLimit: setDoc.attemptLimit, durationMinutes: setDoc.durationMinutes, moduleSlug: modDoc?.slug || '', moduleDurationMinutes: modDoc?.durationMinutes || 20 }
  const attemptLimit = await evaluateAttemptLimit(user.id, plan, { id: set.id, attemptLimit: set.attemptLimit })

  if (!attemptLimit.allowed) {
    throw new AttemptServiceError(403, `Attempt limit reached for this set (${attemptLimit.used}/${attemptLimit.limit}). Premium plans include unlimited attempts.`)
  }

  const startedAt = new Date()
  const durationMinutes = set.durationMinutes ?? set.moduleDurationMinutes
  const expiresAt = new Date(startedAt.getTime() + durationMinutes * 60_000)

  const created = await AssessmentAttempt.create({
    userId: user.id,
    practiceSetId: set.id,
    startedAt,
    expiresAt,
    status: 'in_progress',
  })

  return {
    id: String(created._id),
    practiceSetId: String(created.practiceSetId),
    status: created.status,
    startedAt: created.startedAt,
    expiresAt: created.expiresAt,
    moduleSlug: set.moduleSlug,
  }
}

export async function saveAnswer(attemptId: string, input: z.infer<typeof answerSchema>) {
  const user = await requireCurrentAppUser()
  await connectToDatabase()

  const attempt = await getOwnedAttempt(user.id, attemptId)

  if (!attempt) {
    throw new AttemptServiceError(404, 'Attempt not found.')
  }

  if (attempt.status !== 'in_progress') {
    throw new AttemptServiceError(409, 'This attempt is no longer accepting answers.')
  }

  const now = new Date()

  if (isExpired(attempt.expiresAt, now)) {
    await AssessmentAttempt.updateOne({ _id: attempt.id }, { status: 'expired', updatedAt: now })
    throw new AttemptServiceError(409, 'This attempt has expired.')
  }

  const qDoc = await Question.findOne({ _id: input.questionId, practiceSetId: attempt.practiceSetId }).lean()

  if (!qDoc) {
    throw new AttemptServiceError(404, 'Question does not belong to this attempt.')
  }

  const answer = await AttemptAnswer.findOneAndUpdate(
    { attemptId: attempt.id, questionId: String(qDoc._id) },
    { answer: input.answer, answeredAt: now },
    { upsert: true, returnDocument: 'after' }
  ).lean()

  return {
    attemptId: String(answer?.attemptId),
    questionId: String(answer?.questionId),
    answeredAt: answer?.answeredAt,
  }
}

export async function submitAttempt(attemptId: string) {
  const user = await requireCurrentAppUser()
  await connectToDatabase()

  const attempt = await getOwnedAttempt(user.id, attemptId)

  if (!attempt) {
    throw new AttemptServiceError(404, 'Attempt not found.')
  }

  if (attempt.status === 'submitted' || attempt.status === 'expired') {
    return attempt
  }

  const now = new Date()

  if (isExpired(attempt.expiresAt, now)) {
    const expired = await AssessmentAttempt.findByIdAndUpdate(attempt.id, { status: 'expired', updatedAt: now }, { returnDocument: 'after' }).lean()
    return expired ? { ...expired, id: String(expired._id) } : attempt
  }

  const submitted = await AssessmentAttempt.findOneAndUpdate(
    { _id: attempt.id, status: 'in_progress' },
    { status: 'submitted', submittedAt: now, updatedAt: now },
    { returnDocument: 'after' }
  ).lean()

  if (submitted) {
    const scoring = await scoreAttempt(attempt.id)
    const scored = await AssessmentAttempt.findByIdAndUpdate(
      attempt.id,
      { score: scoring.score, result: scoring.result, updatedAt: new Date() },
      { returnDocument: 'after' }
    ).lean()
    await recordProgress(user.id, attempt.id, scoring.score)
    return scored ? { ...scored, id: String(scored._id) } : submitted
  }

  return (await getOwnedAttempt(user.id, attempt.id)) ?? attempt
}
