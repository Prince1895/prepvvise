import { z } from 'zod'

import { requireCurrentAppUser } from '@/lib/auth/current-user'
import {
  connectToDatabase,
  CodingProblem,
  AssessmentAttempt,
  CodingSubmission,
} from '@/lib/db/client'
import { recordProgress } from '@/lib/services/progress'

const MAX_SOURCE_CODE_LENGTH = 50_000

export const testResultItemSchema = z.object({
  testCaseId: z.string().optional(),
  name: z.string().optional(),
  passed: z.boolean(),
  actualOutput: z.string().optional(),
  expectedOutput: z.string().optional(),
  status: z.string().optional(),
  stderr: z.string().optional(),
  executionTimeMs: z.number().optional(),
  hidden: z.boolean().optional(),
})

export const codingSolutionSchema = z.object({
  problemId: z.string(),
  language: z.enum(['c', 'cpp', 'java', 'python', 'javascript']),
  sourceCode: z.string().trim().min(1).max(MAX_SOURCE_CODE_LENGTH),
  isSampleOnly: z.boolean().optional().default(false),
  // Optional client-evaluated browser execution results
  clientResult: z.object({
    verdict: z.string(),
    passed: z.number(),
    total: z.number(),
    testResults: z.array(testResultItemSchema).optional(),
    totalExecutionTimeMs: z.number().optional(),
  }).optional(),
})

export class CodingServiceError extends Error {
  constructor(public readonly status: 400 | 404 | 409 | 503, message: string) {
    super(message)
  }
}

export type ProblemTestCase = {
  name: string
  stdin: string
  expectedOutput: string
  hidden: boolean
}

export function sanitizeProblem(problem: any) {
  const rawCases = (problem.testCases ?? []) as Array<Record<string, unknown>>
  return {
    id: String(problem._id),
    slug: problem.slug,
    title: problem.title,
    statement: problem.statement,
    difficulty: problem.difficulty,
    topic: problem.topic ?? 'Debugging',
    position: problem.position ?? 1,
    marks: problem.marks ?? 10,
    languages: problem.languages,
    starterCode: problem.starterCode,
    buggyCode: problem.buggyCode,
    explanation: problem.explanation,
    practiceSetId: problem.practiceSetId ? String(problem.practiceSetId) : null,
    sampleCases: rawCases
      .filter((testCase) => !testCase.hidden)
      .map(({ name, stdin, expectedOutput }) => ({
        name: String(name ?? 'Sample Case'),
        stdin: String(stdin ?? ''),
        expectedOutput: String(expectedOutput ?? ''),
      })),
    hiddenCaseCount: rawCases.filter((testCase) => testCase.hidden).length,
  }
}

export async function listCodingProblems(filter?: { moduleId?: string; practiceSetId?: string }) {
  await connectToDatabase()
  const query: Record<string, unknown> = {}
  if (filter?.moduleId) query.moduleId = filter.moduleId
  if (filter?.practiceSetId) query.practiceSetId = filter.practiceSetId

  const rows = await CodingProblem.find(query).sort({ position: 1, slug: 1 }).lean()
  return rows.map(sanitizeProblem)
}

export async function submitCodingSolution(attemptId: string, input: z.infer<typeof codingSolutionSchema>) {
  const user = await requireCurrentAppUser()
  await connectToDatabase()

  const attempt = await AssessmentAttempt.findOne({ _id: attemptId, userId: user.id }).lean()

  if (!attempt) {
    throw new CodingServiceError(404, 'Attempt not found.')
  }

  if (attempt.status !== 'in_progress') {
    throw new CodingServiceError(409, 'This attempt is no longer accepting submissions.')
  }

  if (Date.now() >= attempt.expiresAt.getTime()) {
    await AssessmentAttempt.updateOne({ _id: attempt._id }, { status: 'expired', updatedAt: new Date() })
    throw new CodingServiceError(409, 'This attempt has expired.')
  }

  const problem = await CodingProblem.findById(input.problemId).lean()

  if (!problem) {
    throw new CodingServiceError(404, 'Coding problem not found.')
  }

  const languages = problem.languages?.length ? problem.languages : ['c', 'cpp', 'java', 'python', 'javascript']
  if (!languages.includes(input.language)) {
    throw new CodingServiceError(400, `Language ${input.language} is not enabled for this problem.`)
  }

  const clientRes = input.clientResult
  const passed = clientRes?.passed ?? 0
  const total = clientRes?.total ?? 1
  const status = passed === total && total > 0 ? 'passed' : 'failed'

  const safeResults = (clientRes?.testResults ?? []).map((r) => {
    if (r.hidden) {
      return {
        name: r.name || 'Hidden Case',
        passed: r.passed,
        hidden: true,
      }
    }
    return r
  })

  const submission = await CodingSubmission.create({
    attemptId: String(attempt._id),
    userId: user.id,
    language: input.language,
    sourceCode: input.sourceCode,
    status,
    testResult: {
      total,
      passed,
      failed: total - passed,
      verdict: clientRes?.verdict || (status === 'passed' ? 'accepted' : 'wrong_answer'),
      executionTimeMs: clientRes?.totalExecutionTimeMs || 0,
      results: safeResults,
    },
  })

  // Calculate attempt score proportional to test cases passed
  const score = Math.round((passed / total) * 100)

  // Update assessment attempt score and record progress
  await AssessmentAttempt.findByIdAndUpdate(attempt._id, {
    score,
    updatedAt: new Date(),
  })
  await recordProgress(user.id, String(attempt._id), score)

  return {
    id: String(submission._id),
    status: submission.status,
    score,
    testResult: {
      total,
      passed,
      failed: total - passed,
      verdict: clientRes?.verdict || (status === 'passed' ? 'accepted' : 'wrong_answer'),
      results: safeResults,
    },
  }
}
