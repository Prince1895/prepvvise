import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getAdminKeyFromRequest, hasAdminSecretKey, isValidAdminKey } from '@/lib/auth/admin-key'
import { getHardcodedLearningSections } from '@/lib/content/technical-learning-content'
import {
  connectToDatabase,
  AssessmentModule,
  PracticeSet,
  Question,
  QuestionOption,
  User,
  AdminOffer,
  Payment,
  SubscriptionPlan,
  CodingProblem,
  AssessmentAttempt,
  AttemptAnswer,
  CodingSubmission,
  SpeakingSubmission,
} from '@/lib/db/client'
import { runOnce } from '@/lib/execution/runner'

const actionSchema = z.enum([
  'create-module',
  'update-module',
  'create-set',
  'update-set',
  'create-question',
  'update-question',
  'create-offer',
  'update-offer',
  'update-user',
  'create-plan',
  'create-coding-problem',
  'update-coding-problem',
  'add-test-case',
  'remove-test-case',
  'test-runner',
])

const idSchema = z.string().min(1)

const testRunnerSchema = z.object({
  language: z.string().min(1),
  code: z.string().min(1),
  stdin: z.string().optional().default(''),
})

async function requireAdminKey(request: Request) {
  if (!hasAdminSecretKey()) {
    throw new Error('ADMIN_SECRET_KEY is not configured on server.')
  }
  const provided = getAdminKeyFromRequest(request)
  if (!provided || !isValidAdminKey(provided)) {
    throw new Error('Invalid Admin Secret Key.')
  }
}

function normalizeDoc(doc: any) {
  if (!doc) return doc
  const id = String(doc._id || doc.id)
  return { ...doc, id, _id: id }
}

async function getAdminData(request: Request) {
  await requireAdminKey(request)
  await connectToDatabase()

  const [rawModules, rawSets, rawQuestions, rawOptions, rawUsers, rawOffers, rawPayments, rawPlans, rawProblems] = await Promise.all([
    AssessmentModule.find().sort({ name: 1 }).lean(),
    PracticeSet.find().sort({ setNumber: 1 }).lean(),
    Question.find().sort({ position: 1 }).lean(),
    QuestionOption.find().sort({ position: 1 }).lean(),
    User.find().sort({ createdAt: -1 }).limit(250).lean(),
    AdminOffer.find().sort({ createdAt: -1 }).lean(),
    Payment.find().sort({ createdAt: -1 }).limit(50).lean(),
    SubscriptionPlan.find().sort({ slug: 1 }).lean(),
    CodingProblem.find().sort({ position: 1 }).lean(),
  ])

  const modules = rawModules.map(normalizeDoc)
  const sets = rawSets.map(normalizeDoc)
  const allQuestions = rawQuestions.map(normalizeDoc)
  const options = rawOptions.map(normalizeDoc)
  const appUsers = rawUsers.map(normalizeDoc)
  const offers = rawOffers.map(normalizeDoc)
  const recentPayments = rawPayments.map(normalizeDoc)
  const plans = rawPlans.map(normalizeDoc)
  const problems = rawProblems.map(normalizeDoc)

  return {
    modules: modules.map((module) => ({
      ...module,
      learningSections: getHardcodedLearningSections(module.slug),
      sets: sets.filter((set) => set.moduleId === module.id).map((set) => ({
        ...set,
        questions: allQuestions.filter((question) => question.practiceSetId === set.id).map((question) => ({
          ...question,
          options: options.filter((option) => option.questionId === question.id),
        })),
        codingProblems: problems.filter((problem) => problem.practiceSetId === set.id),
      })),
    })),
    users: appUsers,
    offers,
    payments: recentPayments,
    plans,
    codingProblems: problems,
    counts: {
      modules: modules.length,
      sets: sets.length,
      questions: allQuestions.length,
      users: appUsers.length,
      payments: recentPayments.length,
      codingProblems: problems.length,
    },
  }
}

export async function GET(request: Request) {
  try {
    return NextResponse.json(await getAdminData(request))
  } catch (error) {
    console.error('[admin GET]', error)
    const message = error instanceof Error ? error.message : 'Unauthorized'
    const status = message.includes('ADMIN_SECRET_KEY') ? 500 : 401
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminKey(request)
    await connectToDatabase()

    const body = await request.json()
    const action = actionSchema.parse(body.action)

    if (action === 'test-runner') {
      const parsed = testRunnerSchema.parse(body)
      const res = await runOnce({
        submissionId: 'admin-test',
        language: parsed.language as any,
        sourceCode: parsed.code,
        stdin: parsed.stdin,
      })
      return NextResponse.json({ result: res })
    }

    if (action === 'create-module') {
      const input = z.object({
        slug: z.string().min(1),
        name: z.string().min(1),
        description: z.string().nullable().optional(),
      }).parse(body)

      const doc = await AssessmentModule.create({
        slug: input.slug,
        name: input.name,
        description: input.description ?? null,
      })
      return NextResponse.json({ success: true, module: normalizeDoc(doc.toObject()) })
    }

    if (action === 'update-module') {
      const input = z.object({
        id: idSchema,
        slug: z.string().optional(),
        name: z.string().optional(),
        description: z.string().nullable().optional(),
      }).parse(body)

      const updated = await AssessmentModule.findByIdAndUpdate(
        input.id,
        {
          ...(input.slug && { slug: input.slug }),
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
        },
        { new: true }
      ).lean()
      return NextResponse.json({ success: true, module: normalizeDoc(updated) })
    }

    if (action === 'create-set') {
      const input = z.object({
        moduleId: idSchema.optional(),
        moduleSlug: z.string().optional(),
        name: z.string().min(1),
        setNumber: z.number().int().positive().optional(),
        access: z.enum(['free', 'premium']).default('free'),
        type: z.enum(['focused', 'mixed']).default('focused'),
        category: z.string().nullable().optional(),
        difficulty: z.enum(['easy', 'medium', 'hard']).nullable().optional(),
        durationMinutes: z.number().int().positive().default(20),
        attemptLimit: z.number().int().positive().nullable().optional(),
      }).parse(body)

      let targetModuleId = input.moduleId
      if (!targetModuleId && input.moduleSlug) {
        const mod = await AssessmentModule.findOne({ slug: input.moduleSlug }).lean()
        if (mod) targetModuleId = String(mod._id)
      }

      if (!targetModuleId) {
        return NextResponse.json({ error: 'Module not found.' }, { status: 400 })
      }

      let setNum = input.setNumber
      if (!setNum) {
        const maxSet = await PracticeSet.findOne({ moduleId: targetModuleId }).sort({ setNumber: -1 }).lean()
        setNum = (maxSet?.setNumber ?? 0) + 1
      }

      const doc = await PracticeSet.create({
        moduleId: targetModuleId,
        setNumber: setNum,
        name: input.name,
        access: input.access,
        type: input.type,
        status: 'published',
        category: input.category ?? null,
        difficulty: input.difficulty ?? null,
        durationMinutes: input.durationMinutes,
        attemptLimit: input.attemptLimit ?? 3,
      })

      return NextResponse.json({ success: true, set: normalizeDoc(doc.toObject()) })
    }

    if (action === 'update-set') {
      const input = z.object({
        id: idSchema,
        name: z.string().optional(),
        access: z.enum(['free', 'premium']).optional(),
        type: z.enum(['focused', 'mixed']).optional(),
        durationMinutes: z.number().int().positive().optional(),
        attemptLimit: z.number().int().positive().nullable().optional(),
      }).parse(body)

      const updated = await PracticeSet.findByIdAndUpdate(
        input.id,
        {
          ...(input.name && { name: input.name }),
          ...(input.access && { access: input.access }),
          ...(input.type && { type: input.type }),
          ...(input.durationMinutes && { durationMinutes: input.durationMinutes }),
          ...(input.attemptLimit !== undefined && { attemptLimit: input.attemptLimit }),
        },
        { new: true }
      ).lean()

      return NextResponse.json({ success: true, set: normalizeDoc(updated) })
    }

    if (action === 'create-question' || action === 'update-question') {
      const input = z.object({
        id: idSchema.optional(),
        practiceSetId: idSchema.optional(),
        prompt: z.string().min(1),
        kind: z.string().default('mcq'),
        content: z.record(z.string(), z.unknown()).default({}),
        explanation: z.string().nullable().optional(),
        options: z.array(z.object({
          label: z.string().min(1),
          value: z.string().min(1),
          isCorrect: z.boolean(),
        })).default([]),
      }).parse(body)

      if (action === 'create-question') {
        if (!input.practiceSetId) {
          return NextResponse.json({ error: 'practiceSetId required' }, { status: 400 })
        }
        const maxQ = await Question.findOne({ practiceSetId: input.practiceSetId }).sort({ position: -1 }).lean()
        const nextPos = (maxQ?.position ?? 0) + 1

        const qDoc = await Question.create({
          practiceSetId: input.practiceSetId,
          position: nextPos,
          prompt: input.prompt,
          kind: input.kind,
          content: input.content,
          explanation: input.explanation ?? null,
        })

        const qId = String(qDoc._id)
        if (input.options.length > 0) {
          await QuestionOption.insertMany(
            input.options.map((opt, idx) => ({
              questionId: qId,
              position: idx + 1,
              label: opt.label,
              value: opt.value,
              isCorrect: opt.isCorrect,
            }))
          )
        }

        return NextResponse.json({ success: true, question: normalizeDoc(qDoc.toObject()) })
      } else {
        if (!input.id) return NextResponse.json({ error: 'Question ID required' }, { status: 400 })

        const updatedQ = await Question.findByIdAndUpdate(
          input.id,
          {
            prompt: input.prompt,
            kind: input.kind,
            content: input.content,
            explanation: input.explanation ?? null,
          },
          { new: true }
        ).lean()

        await QuestionOption.deleteMany({ questionId: input.id })
        if (input.options.length > 0) {
          await QuestionOption.insertMany(
            input.options.map((opt, idx) => ({
              questionId: input.id,
              position: idx + 1,
              label: opt.label,
              value: opt.value,
              isCorrect: opt.isCorrect,
            }))
          )
        }

        return NextResponse.json({ success: true, question: normalizeDoc(updatedQ) })
      }
    }

    if (action === 'create-coding-problem' || action === 'update-coding-problem') {
      const input = z.object({
        id: idSchema.optional(),
        practiceSetId: idSchema.optional(),
        title: z.string().min(1),
        slug: z.string().min(1),
        statement: z.string().min(1),
        difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
        topic: z.string().default('General'),
        languages: z.array(z.string()).default(['c', 'cpp', 'java', 'python', 'javascript']),
        starterCode: z.record(z.string(), z.string()).default({}),
        buggyCode: z.record(z.string(), z.string()).default({}),
        explanation: z.string().nullable().optional(),
        testCases: z.array(z.object({
          name: z.string(),
          stdin: z.string(),
          expectedOutput: z.string(),
          hidden: z.boolean().default(false),
        })).default([]),
      }).parse(body)

      if (action === 'create-coding-problem') {
        const doc = await CodingProblem.create({
          practiceSetId: input.practiceSetId ?? null,
          title: input.title,
          slug: input.slug,
          statement: input.statement,
          difficulty: input.difficulty,
          topic: input.topic,
          languages: input.languages,
          starterCode: input.starterCode as any,
          buggyCode: input.buggyCode as any,
          explanation: input.explanation ?? null,
          testCases: input.testCases as any,
        })
        return NextResponse.json({ success: true, problem: normalizeDoc((doc as any).toObject()) })
      } else {
        if (!input.id) return NextResponse.json({ error: 'Problem ID required' }, { status: 400 })
        const updatedProb = await CodingProblem.findByIdAndUpdate(
          input.id,
          {
            title: input.title,
            slug: input.slug,
            statement: input.statement,
            difficulty: input.difficulty,
            topic: input.topic,
            languages: input.languages,
            starterCode: input.starterCode,
            buggyCode: input.buggyCode,
            explanation: input.explanation ?? null,
            testCases: input.testCases,
          },
          { new: true }
        ).lean()
        return NextResponse.json({ success: true, problem: normalizeDoc(updatedProb) })
      }
    }

    if (action === 'update-user') {
      const input = z.object({
        id: idSchema,
        role: z.enum(['user', 'admin']).optional(),
        plan: z.enum(['free', 'premium']).optional(),
      }).parse(body)

      const updatedUser = await User.findByIdAndUpdate(
        input.id,
        {
          ...(input.role && { role: input.role }),
          ...(input.plan && { plan: input.plan }),
        },
        { new: true }
      ).lean()

      return NextResponse.json({ success: true, user: normalizeDoc(updatedUser) })
    }

    if (action === 'create-offer' || action === 'update-offer') {
      const input = z.object({
        id: idSchema.optional(),
        name: z.string().min(1),
        description: z.string().nullable().optional(),
        amountPaise: z.number().int().positive(),
        active: z.boolean().default(true),
      }).parse(body)

      if (action === 'create-offer') {
        const doc = await AdminOffer.create({
          name: input.name,
          description: input.description ?? null,
          amountPaise: input.amountPaise,
          active: input.active,
        })
        return NextResponse.json({ success: true, offer: normalizeDoc((doc as any).toObject()) })
      } else {
        if (!input.id) return NextResponse.json({ error: 'Offer ID required' }, { status: 400 })
        const updatedOffer = await AdminOffer.findByIdAndUpdate(
          input.id,
          {
            name: input.name,
            description: input.description ?? null,
            amountPaise: input.amountPaise,
            active: input.active,
          },
          { new: true }
        ).lean()
        return NextResponse.json({ success: true, offer: normalizeDoc(updatedOffer) })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[admin POST]', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdminKey(request)
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const resource = searchParams.get('resource')
    const id = searchParams.get('id')

    if (!resource || !id) {
      return NextResponse.json({ error: 'Resource and ID are required' }, { status: 400 })
    }

    if (resource === 'module') {
      await AssessmentModule.findByIdAndDelete(id)
      return NextResponse.json({ success: true })
    }

    if (resource === 'set') {
      const attempts = await AssessmentAttempt.find({ practiceSetId: id }).select('_id').lean()
      const attemptIds = attempts.map((a) => String(a._id))

      await Promise.all([
        AttemptAnswer.deleteMany({ attemptId: { $in: attemptIds } }),
        CodingSubmission.deleteMany({ attemptId: { $in: attemptIds } }),
        SpeakingSubmission.deleteMany({ attemptId: { $in: attemptIds } }),
        AssessmentAttempt.deleteMany({ practiceSetId: id }),
      ])

      const questions = await Question.find({ practiceSetId: id }).select('_id').lean()
      const qIds = questions.map((q) => String(q._id))

      await Promise.all([
        QuestionOption.deleteMany({ questionId: { $in: qIds } }),
        Question.deleteMany({ practiceSetId: id }),
        CodingProblem.deleteMany({ practiceSetId: id }),
        PracticeSet.findByIdAndDelete(id),
      ])

      return NextResponse.json({ success: true })
    }

    if (resource === 'question') {
      await Promise.all([
        QuestionOption.deleteMany({ questionId: id }),
        AttemptAnswer.deleteMany({ questionId: id }),
        SpeakingSubmission.deleteMany({ questionId: id }),
        Question.findByIdAndDelete(id),
      ])
      return NextResponse.json({ success: true })
    }

    if (resource === 'coding-problem') {
      await CodingProblem.findByIdAndDelete(id)
      return NextResponse.json({ success: true })
    }

    if (resource === 'offer') {
      await AdminOffer.findByIdAndDelete(id)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unsupported resource for deletion' }, { status: 400 })
  } catch (error) {
    console.error('[admin DELETE]', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
