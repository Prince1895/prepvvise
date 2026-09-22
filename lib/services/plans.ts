import { connectToDatabase, SubscriptionPlan, AssessmentAttempt, PracticeSet } from '@/lib/db/client'

export type PlanSlug = 'free' | 'premium'

export type PlanEntitlements = {
  slug: PlanSlug
  displayName: string
  /** NULL limit = unlimited access to that category. */
  practiceSetAccessLimit: number | null
  mockAccessLimit: number | null
  dailyAccessLimit: number | null
  unlimitedAttempts: boolean
  aiAnalysis: boolean
  aiAnalysisDailyLimit: number | null
  aiCoachDailyLimit: number | null
  pricePaise: number
}

// Fallbacks used when a plan row is missing from subscription_plans.
export const DEFAULT_PLAN_ENTITLEMENTS: Record<PlanSlug, PlanEntitlements> = {
  free: {
    slug: 'free',
    displayName: 'Free',
    practiceSetAccessLimit: 3,
    mockAccessLimit: 1,
    dailyAccessLimit: 1,
    unlimitedAttempts: false,
    aiAnalysis: true,
    aiAnalysisDailyLimit: 2,
    aiCoachDailyLimit: 5,
    pricePaise: 0,
  },
  premium: {
    slug: 'premium',
    displayName: 'Premium',
    practiceSetAccessLimit: null,
    mockAccessLimit: null,
    dailyAccessLimit: null,
    unlimitedAttempts: true,
    aiAnalysis: true,
    aiAnalysisDailyLimit: null,
    aiCoachDailyLimit: null,
    pricePaise: 49_900,
  },
}

export type SetCategory = 'practice' | 'mock' | 'daily'

export function categoryForSetType(type: string): SetCategory {
  if (type === 'mock') return 'mock'
  if (type === 'daily') return 'daily'
  return 'practice'
}

function limitForCategory(plan: PlanEntitlements, category: SetCategory): number | null {
  if (category === 'mock') return plan.mockAccessLimit
  if (category === 'daily') return plan.dailyAccessLimit
  return plan.practiceSetAccessLimit
}

export async function getPlanEntitlements(plan: PlanSlug): Promise<PlanEntitlements> {
  await connectToDatabase()
  const row = await SubscriptionPlan.findOne({ slug: plan }).lean()

  if (!row) {
    return DEFAULT_PLAN_ENTITLEMENTS[plan]
  }

  return {
    slug: plan,
    displayName: row.displayName,
    practiceSetAccessLimit: row.practiceSetAccessLimit ?? null,
    mockAccessLimit: row.mockAccessLimit ?? null,
    dailyAccessLimit: row.dailyAccessLimit ?? null,
    unlimitedAttempts: row.unlimitedAttempts,
    aiAnalysis: row.aiAnalysis,
    aiAnalysisDailyLimit: row.aiAnalysisDailyLimit ?? null,
    aiCoachDailyLimit: row.aiCoachDailyLimit ?? null,
    pricePaise: row.pricePaise,
  }
}

async function countDistinctSetsWithAttempts(userId: string, types: Array<'focused' | 'mixed' | 'mock' | 'daily'>) {
  await connectToDatabase()
  const sets = await PracticeSet.find({ type: { $in: types } }).select('_id').lean()
  const setIds = sets.map((s) => String(s._id))

  const attempts = await AssessmentAttempt.find({ userId, practiceSetId: { $in: setIds } }).distinct('practiceSetId')
  return attempts.length
}

export async function countUsedSets(userId: string, category: SetCategory): Promise<number> {
  const types: Array<'focused' | 'mixed' | 'mock' | 'daily'> = category === 'mock' ? ['mock'] : category === 'daily' ? ['daily'] : ['focused', 'mixed']
  return countDistinctSetsWithAttempts(userId, types)
}

export type SetAccessEvaluation = {
  allowed: boolean
  reason: 'plan_quota' | null
  category: SetCategory
  limit: number | null
  used: number
}

export async function evaluateSetAccess(
  userId: string,
  plan: PlanEntitlements,
  set: { access: string; type: string },
): Promise<SetAccessEvaluation> {
  const category = categoryForSetType(set.type)
  const limit = limitForCategory(plan, category)

  if (set.access !== 'premium') {
    return { allowed: true, reason: null, category, limit, used: await countUsedSets(userId, category) }
  }

  if (limit === null) {
    return { allowed: true, reason: null, category, limit, used: await countUsedSets(userId, category) }
  }

  const used = await countUsedSets(userId, category)
  return { allowed: used < limit, reason: used < limit ? null : 'plan_quota', category, limit, used }
}

export async function evaluateAttemptLimit(
  userId: string,
  plan: PlanEntitlements,
  set: { id: string; attemptLimit?: number | null },
): Promise<{ allowed: boolean; limit: number | null; used: number }> {
  await connectToDatabase()
  const used = await AssessmentAttempt.countDocuments({ userId, practiceSetId: set.id })

  if (plan.unlimitedAttempts) {
    return { allowed: true, limit: null, used }
  }

  const limit = set.attemptLimit ?? 3
  return { allowed: used < limit, limit, used }
}

export async function getEntitlementSummary(userId: string, plan: PlanSlug) {
  const entitlements = await getPlanEntitlements(plan)
  const [practiceUsed, mockUsed, dailyUsed] = await Promise.all([
    countUsedSets(userId, 'practice'),
    countUsedSets(userId, 'mock'),
    countUsedSets(userId, 'daily'),
  ])

  return {
    plan: entitlements,
    usage: {
      practice: { used: practiceUsed, limit: entitlements.practiceSetAccessLimit },
      mock: { used: mockUsed, limit: entitlements.mockAccessLimit },
      daily: { used: dailyUsed, limit: entitlements.dailyAccessLimit },
    },
  }
}
