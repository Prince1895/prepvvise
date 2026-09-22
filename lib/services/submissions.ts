import { z } from 'zod'

import { requireCurrentAppUser } from '@/lib/auth/current-user'
import {
  connectToDatabase,
  AssessmentAttempt,
  PracticeSet,
  AssessmentModule,
  CodingSubmission,
} from '@/lib/db/client'
import { executionLimits, dispatchExecution, ExecutionClientError } from '@/lib/execution/client'

const MAX_SOURCE_CODE_LENGTH = 50_000

export const debuggingSubmissionSchema = z.object({
  language: z.enum(['c', 'cpp', 'java', 'python', 'javascript']),
  sourceCode: z.string().trim().min(1).max(MAX_SOURCE_CODE_LENGTH),
})

export class SubmissionServiceError extends Error {
  constructor(public readonly status: 400 | 404 | 409 | 503, message: string) {
    super(message)
  }
}

export async function submitDebuggingCode(
  attemptId: string,
  input: z.infer<typeof debuggingSubmissionSchema>,
) {
  const user = await requireCurrentAppUser()
  await connectToDatabase()

  const attemptDoc = await AssessmentAttempt.findOne({ _id: attemptId, userId: user.id }).lean()

  if (!attemptDoc) {
    throw new SubmissionServiceError(404, 'Attempt not found.')
  }

  const setDoc = await PracticeSet.findById(attemptDoc.practiceSetId).lean()
  const modDoc = setDoc ? await AssessmentModule.findById(setDoc.moduleId).lean() : null

  if (modDoc?.slug !== 'debugging') {
    throw new SubmissionServiceError(400, 'Code submissions are only available for debugging attempts.')
  }

  if (attemptDoc.status !== 'in_progress') {
    throw new SubmissionServiceError(409, 'This attempt is no longer accepting submissions.')
  }

  if (Date.now() >= attemptDoc.expiresAt.getTime()) {
    await AssessmentAttempt.updateOne({ _id: attemptDoc._id }, { status: 'expired', updatedAt: new Date() })
    throw new SubmissionServiceError(409, 'This attempt has expired.')
  }

  const submission = await CodingSubmission.create({
    attemptId: String(attemptDoc._id),
    userId: user.id,
    language: input.language,
    sourceCode: input.sourceCode,
    status: 'queued',
  })

  try {
    const dispatch = await dispatchExecution({
      submissionId: String(submission._id),
      language: input.language,
      sourceCode: input.sourceCode,
      problemId: String(attemptDoc.practiceSetId),
      limits: executionLimits,
    })

    const updated = await CodingSubmission.findByIdAndUpdate(
      submission._id,
      {
        providerJobId: dispatch.providerJobId,
        status: dispatch.status,
        updatedAt: new Date(),
      },
      { returnDocument: 'after' }
    ).lean()

    return {
      id: String(updated?._id),
      status: updated?.status,
      providerJobId: updated?.providerJobId,
      createdAt: updated?.createdAt,
    }
  } catch (error) {
    if (error instanceof ExecutionClientError) {
      await CodingSubmission.findByIdAndUpdate(submission._id, {
        status: 'error',
        testResult: { error: 'Execution service unavailable.' },
        updatedAt: new Date(),
      })
      throw new SubmissionServiceError(503, error.message)
    }

    throw error
  }
}
