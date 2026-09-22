import { NextResponse } from 'next/server'
import { z } from 'zod'

import { listModuleSets } from '@/lib/services/catalog'

const moduleIdSchema = z.string().min(1)

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ moduleId: string }> },
) {
  const { moduleId } = await params

  if (!moduleIdSchema.safeParse(moduleId).success) {
    return NextResponse.json({ error: 'Invalid module ID.' }, { status: 400 })
  }

  try {
    const module = await listModuleSets(moduleId)

    if (!module) {
      return NextResponse.json({ error: 'Module not found.' }, { status: 404 })
    }

    return NextResponse.json(module)
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Unable to load practice sets.' }, { status: 500 })
  }
}