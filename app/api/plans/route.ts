import { NextResponse } from 'next/server'

import { getCurrentAppUser } from '@/lib/auth/current-user'
import { DEFAULT_PLAN_ENTITLEMENTS, getPlanEntitlements, type PlanSlug } from '@/lib/services/plans'

export async function GET() {
  const slugs: PlanSlug[] = ['free', 'premium']

  try {
    const user = await getCurrentAppUser()
    const plans = await Promise.all(slugs.map(async (slug) => {
      const entitlements = await getPlanEntitlements(slug)
      return {
        ...entitlements,
        current: user?.plan === slug,
      }
    }))

    return NextResponse.json({ plans })
  } catch {
    // Plans are public information; never fail because auth/DB is unavailable.
    return NextResponse.json({
      plans: slugs.map((slug) => ({ ...DEFAULT_PLAN_ENTITLEMENTS[slug], current: false })),
    })
  }
}