import { NextResponse } from 'next/server'

import { getProgress } from '@/lib/services/progress'

export async function GET() {
  try {
    return NextResponse.json({ progress: await getProgress() })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Unable to load progress.' }, { status: 500 })
  }
}