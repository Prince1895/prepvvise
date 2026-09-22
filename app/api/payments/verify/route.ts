import { NextResponse } from 'next/server'

import { PaymentServiceError, verifyPaymentSchema, verifyPremiumPayment } from '@/lib/services/payments'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }

  const parsed = verifyPaymentSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Valid Razorpay order, payment, and signature are required.' }, { status: 400 })
  }

  try {
    return NextResponse.json(await verifyPremiumPayment(parsed.data))
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    const message = error instanceof Error ? error.message : 'Unable to verify payment.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}