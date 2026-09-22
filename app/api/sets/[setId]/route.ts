import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getSet } from '@/lib/services/catalog'

const setIdSchema = z.string().min(1)

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ setId: string }> },
) {
  const { setId } = await params

  if (!setIdSchema.safeParse(setId).success) {
    return NextResponse.json({ error: 'Invalid set ID.' }, { status: 400 })
  }

  try {
    const set = await getSet(setId)

    if (!set) {
      return NextResponse.json({ error: 'Practice set not found.' }, { status: 404 })
    }

    return NextResponse.json(set)
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Unable to load practice set.' }, { status: 500 })
  }
}