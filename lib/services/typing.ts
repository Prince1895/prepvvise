import { z } from 'zod'

import { requireCurrentAppUser } from '@/lib/auth/current-user'
import { connectToDatabase, TypingResult } from '@/lib/db/client'

export const typingResultSchema = z.object({
  moduleId: z.string().nullable().optional(),
  durationSeconds: z.number().int().min(1).max(3600),
  typedCharacters: z.number().int().min(0).max(100_000),
  correctCharacters: z.number().int().min(0).max(100_000),
})

export class TypingServiceError extends Error {
  constructor(public readonly status: 400, message: string) {
    super(message)
  }
}

export async function recordTypingResult(input: z.infer<typeof typingResultSchema>) {
  const user = await requireCurrentAppUser()
  await connectToDatabase()

  if (input.correctCharacters > input.typedCharacters) {
    throw new TypingServiceError(400, 'Correct characters cannot exceed typed characters.')
  }

  const maxPlausibleChars = Math.ceil(input.durationSeconds * 25) * 5
  if (input.typedCharacters > maxPlausibleChars) {
    throw new TypingServiceError(400, 'Typed character count is not physically plausible for the duration.')
  }

  const minutes = input.durationSeconds / 60
  const wpm = Math.round(input.correctCharacters / 5 / minutes)
  const accuracy = input.typedCharacters > 0
    ? Math.round((input.correctCharacters / input.typedCharacters) * 100)
    : 0

  const created = await TypingResult.create({
    userId: user.id,
    moduleId: input.moduleId ?? null,
    durationSeconds: input.durationSeconds,
    typedCharacters: input.typedCharacters,
    correctCharacters: input.correctCharacters,
    wpm,
    accuracy,
  })

  return {
    id: String(created._id),
    wpm: created.wpm,
    accuracy: created.accuracy,
    durationSeconds: created.durationSeconds,
    createdAt: created.createdAt,
  }
}

export async function getTypingLeaderboard(limit = 10) {
  await connectToDatabase()
  const results = await TypingResult.aggregate([
    {
      $group: {
        _id: '$userId',
        bestWpm: { $max: '$wpm' },
        bestAccuracy: { $max: '$accuracy' },
      },
    },
    { $sort: { bestWpm: -1 } },
    { $limit: limit },
  ])

  return results.map((row, index) => ({
    rank: index + 1,
    userId: String(row._id),
    userName: undefined,
    bestWpm: row.bestWpm,
    bestAccuracy: row.bestAccuracy,
  }))
}

export async function getMyTypingHistory(limit = 20) {
  const user = await requireCurrentAppUser()
  await connectToDatabase()

  const rows = await TypingResult.find({ userId: user.id }).sort({ createdAt: -1 }).limit(limit).lean()

  return rows.map((r) => ({
    id: String(r._id),
    wpm: r.wpm,
    accuracy: r.accuracy,
    durationSeconds: r.durationSeconds,
    createdAt: r.createdAt,
  }))
}
