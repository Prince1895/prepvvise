import { requireCurrentAppUser } from '@/lib/auth/current-user'
import {
  connectToDatabase,
  AssessmentModule,
  PracticeSet,
  ModuleLearningSection,
  Question,
  QuestionOption,
  AssessmentAttempt,
} from '@/lib/db/client'
import { evaluateSetAccess, getPlanEntitlements } from '@/lib/services/plans'
import { getHardcodedLearningSections } from '@/lib/content/technical-learning-content'

function isPremiumUser(plan: 'free' | 'premium') {
  return plan === 'premium'
}

export async function listModules() {
  const user = await requireCurrentAppUser()
  await connectToDatabase()

  const rawModules = await AssessmentModule.find().sort({ name: 1 }).lean()
  const rawSets = await PracticeSet.find().sort({ setNumber: 1 }).lean()
  const rawSections = await ModuleLearningSection.find().sort({ moduleId: 1, position: 1 }).lean()

  const setIds = rawSets.map((s) => String(s._id))
  const userAttempts = await AssessmentAttempt.find({
    userId: user.id,
    practiceSetId: { $in: setIds },
  }).select('practiceSetId score status').lean()

  const attemptsBySet = new Map<string, Array<{ score: number | null; status: string }>>()
  for (const attempt of userAttempts) {
    const setId = String(attempt.practiceSetId)
    const list = attemptsBySet.get(setId) ?? []
    list.push({ score: attempt.score ?? null, status: attempt.status })
    attemptsBySet.set(setId, list)
  }

  const premium = isPremiumUser(user.plan)

  const modules = rawModules.map((m) => ({ id: String(m._id), slug: m.slug, name: m.name, description: m.description }))
  const sets = rawSets.map((s) => {
    const setId = String(s._id)
    const setAttempts = attemptsBySet.get(setId) ?? []
    const submittedScores = setAttempts
      .filter((a) => a.status === 'submitted' && a.score !== null)
      .map((a) => a.score as number)
    const bestScore = submittedScores.length > 0 ? Math.max(...submittedScores) : null
    const attemptsCount = setAttempts.length
    const attemptsLimit = premium ? null : (s.attemptLimit ?? 3)
    const attemptsLeft = premium ? null : Math.max(0, (s.attemptLimit ?? 3) - attemptsCount)
    const locked = (s.access === 'premium' && !premium) || (!premium && attemptsCount >= (s.attemptLimit ?? 3))

    return {
      id: setId,
      moduleId: String(s.moduleId),
      setNumber: s.setNumber,
      name: s.name,
      access: s.access,
      type: s.type,
      durationMinutes: s.durationMinutes ?? 20,
      bestScore,
      attemptsCount,
      attemptsLimit,
      attemptsLeft,
      locked,
    }
  })

  const learningSections = rawSections.map((sec) => ({
    id: String(sec._id),
    moduleId: String(sec.moduleId),
    position: sec.position,
    title: sec.title,
    summary: sec.summary,
    content: sec.content,
    durationMinutes: sec.durationMinutes,
    access: sec.access,
  }))

  return modules.map((module) => {
    const hardcoded = getHardcodedLearningSections(module.slug)
    const dbSections = learningSections.filter((section) => section.moduleId === module.id)
    const rawSecs = dbSections.length === 0 ? hardcoded : dbSections

    return {
      ...module,
      learningSections: rawSecs.map((sec) => {
        if ('moduleId' in sec) {
          const { moduleId: _moduleId, ...rest } = sec as { moduleId?: string } & typeof sec
          return { ...rest, access: 'free' as const }
        }
        return { ...sec, access: 'free' as const }
      }),
      practiceSets: sets.filter((set) => set.moduleId === module.id),
    }
  })
}

export async function listModuleSets(moduleId: string) {
  const user = await requireCurrentAppUser()
  await connectToDatabase()

  let mod = await AssessmentModule.findOne({ _id: moduleId }).lean()
  if (!mod) {
    mod = await AssessmentModule.findOne({ slug: moduleId }).lean()
  }
  if (!mod) {
    return null
  }

  const realModuleId = String(mod._id)
  const module = { id: realModuleId, slug: mod.slug, name: mod.name, description: mod.description }

  const learningSections = (await ModuleLearningSection.find({ moduleId: realModuleId }).sort({ position: 1 }).lean()).map((sec) => ({
    id: String(sec._id),
    position: sec.position,
    title: sec.title,
    summary: sec.summary,
    content: sec.content,
    durationMinutes: sec.durationMinutes,
    access: sec.access,
  }))

  const rawSets = await PracticeSet.find({ moduleId: realModuleId }).sort({ setNumber: 1 }).lean()
  const setIds = rawSets.map((s) => String(s._id))

  const userAttempts = await AssessmentAttempt.find({
    userId: user.id,
    practiceSetId: { $in: setIds },
  }).select('practiceSetId score status').lean()

  const attemptsBySet = new Map<string, Array<{ score: number | null; status: string }>>()
  for (const attempt of userAttempts) {
    const setId = String(attempt.practiceSetId)
    const list = attemptsBySet.get(setId) ?? []
    list.push({ score: attempt.score ?? null, status: attempt.status })
    attemptsBySet.set(setId, list)
  }

  const premium = isPremiumUser(user.plan)

  const sets = rawSets.map((set) => {
    const setId = String(set._id)
    const setAttempts = attemptsBySet.get(setId) ?? []
    const submittedScores = setAttempts
      .filter((a) => a.status === 'submitted' && a.score !== null)
      .map((a) => a.score as number)
    const bestScore = submittedScores.length > 0 ? Math.max(...submittedScores) : null
    const attemptsCount = setAttempts.length
    const attemptsLimit = premium ? null : (set.attemptLimit ?? 3)
    const attemptsLeft = premium ? null : Math.max(0, (set.attemptLimit ?? 3) - attemptsCount)
    const locked = (set.access === 'premium' && !premium) || (!premium && attemptsCount >= (set.attemptLimit ?? 3))

    return {
      id: setId,
      moduleId: String(set.moduleId),
      setNumber: set.setNumber,
      name: set.name,
      access: set.access,
      type: set.type,
      durationMinutes: set.durationMinutes ?? 20,
      bestScore,
      attemptsCount,
      attemptsLimit,
      attemptsLeft,
      locked,
    }
  })

  const hardcoded = getHardcodedLearningSections(module.slug)
  const rawSections = learningSections.length === 0 ? hardcoded : learningSections

  return {
    ...module,
    learningSections: rawSections.map((sec) => ({ ...sec, access: 'free' as const })),
    practiceSets: sets,
  }
}

export async function listSetsByCategory(category: 'mock' | 'daily') {
  const user = await requireCurrentAppUser()
  await connectToDatabase()

  const premium = isPremiumUser(user.plan)
  const plan = await getPlanEntitlements(user.plan)

  const today = new Date()
  const todayIso = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`

  const sets = await PracticeSet.find({ type: category, status: 'published' }).sort({ availableDate: 1, setNumber: 1 }).lean()
  const moduleIds = [...new Set(sets.map((s) => String(s.moduleId)))]
  const modules = await AssessmentModule.find({ _id: { $in: moduleIds } }).lean()
  const moduleMap = new Map(modules.map((m) => [String(m._id), m]))

  const rows = sets.map((s) => {
    const mod = moduleMap.get(String(s.moduleId))
    return {
      id: String(s._id),
      moduleId: String(s.moduleId),
      moduleName: mod?.name || '',
      moduleSlug: mod?.slug || '',
      setNumber: s.setNumber,
      name: s.name,
      access: s.access,
      type: s.type,
      durationMinutes: s.durationMinutes,
      totalMarks: s.totalMarks,
      difficulty: s.difficulty,
      category: s.category,
      availableDate: s.availableDate,
    }
  })

  const visible = category === 'daily'
    ? rows.filter((row) => row.availableDate === null || row.availableDate === todayIso)
    : rows

  return Promise.all(visible.map(async (row) => {
    const access = await evaluateSetAccess(user.id, plan, { access: row.access, type: row.type })
    const planLocked = row.access === 'premium' && !premium && !access.allowed
    return {
      id: row.id,
      moduleName: row.moduleName,
      moduleSlug: row.moduleSlug,
      setNumber: row.setNumber,
      name: row.name,
      access: row.access,
      durationMinutes: row.durationMinutes,
      totalMarks: row.totalMarks,
      difficulty: row.difficulty,
      category: row.category,
      availableDate: row.availableDate,
      locked: row.access === 'premium' && !premium,
      planLocked,
      usage: { used: access.used, limit: access.limit },
    }
  }))
}

export async function getSet(setId: string) {
  const user = await requireCurrentAppUser()
  await connectToDatabase()

  const setDoc = await PracticeSet.findOne({ _id: setId }).lean()
  if (!setDoc) {
    return null
  }

  const modDoc = await AssessmentModule.findOne({ _id: String(setDoc.moduleId) }).lean()
  const set = {
    id: String(setDoc._id),
    moduleId: String(setDoc.moduleId),
    moduleSlug: modDoc?.slug || '',
    moduleName: modDoc?.name || '',
    setNumber: setDoc.setNumber,
    name: setDoc.name,
    access: setDoc.access,
    type: setDoc.type,
  }

  const locked = set.access === 'premium' && !isPremiumUser(user.plan)

  if (locked) {
    return { ...set, locked: true, questions: [] }
  }

  const setQuestions = (await Question.find({ practiceSetId: setId }).sort({ position: 1 }).lean()).map((q) => ({
    id: String(q._id),
    position: q.position,
    prompt: q.prompt,
    kind: q.kind,
    content: q.content,
    explanation: q.explanation,
  }))

  const questionIds = setQuestions.map((q) => q.id)
  const options = (await QuestionOption.find({ questionId: { $in: questionIds } }).sort({ position: 1 }).lean()).map((o) => ({
    id: String(o._id),
    questionId: String(o.questionId),
    position: o.position,
    label: o.label,
    value: o.value,
  }))

  const optionsByQuestion = new Map<string, Array<{ id: string; label: string; value: string }>>()
  for (const option of options) {
    const existing = optionsByQuestion.get(option.questionId) ?? []
    existing.push({ id: option.id, label: option.label, value: option.value })
    optionsByQuestion.set(option.questionId, existing)
  }

  return {
    ...set,
    locked: false,
    questions: setQuestions.map((question) => ({
      ...question,
      options: optionsByQuestion.get(question.id) ?? [],
    })),
  }
}
