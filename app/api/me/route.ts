import { NextResponse } from 'next/server'

import { getCurrentAppUser } from '@/lib/auth/current-user'
import { getEntitlementSummary } from '@/lib/services/plans'

export async function GET() {
  try {
    const user = await getCurrentAppUser()

    if (!user) {
      return NextResponse.json({ error: 'User synchronization is pending.' }, { status: 409 })
    }

    // Sign-in is for regular users only. Admin access is gated by
    // ADMIN_SECRET_KEY, not by email/role.
    const entitlements = await getEntitlementSummary(user.id, user.plan)

    return NextResponse.json({
      id: user.id,
      clerkUserId: user.clerkUserId,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
      entitlements,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Unable to load current user.' }, { status: 500 })
  }
}