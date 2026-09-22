import { NextResponse } from 'next/server'

import { listModules } from '@/lib/services/catalog'

export async function GET() {
  try {
    return NextResponse.json({ modules: await listModules() })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Unable to load assessment modules.' }, { status: 500 })
  }
}