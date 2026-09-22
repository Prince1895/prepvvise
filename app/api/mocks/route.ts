import { NextResponse } from 'next/server'

import { listSetsByCategory } from '@/lib/services/catalog'

export async function GET() {
  try {
    return NextResponse.json({ sets: await listSetsByCategory('mock') })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Unable to load mock tests.' }, { status: 500 })
  }
}