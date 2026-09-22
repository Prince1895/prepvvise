import { NextResponse } from 'next/server'

import { listSetsByCategory } from '@/lib/services/catalog'

export async function GET() {
  try {
    return NextResponse.json({ sets: await listSetsByCategory('daily') })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Unable to load daily assessments.' }, { status: 500 })
  }
}