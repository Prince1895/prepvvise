import { NextResponse } from 'next/server'

import { createPremiumOrder, PaymentServiceError } from '@/lib/services/payments'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const idempotencyKey = request.headers.get('x-idempotency-key')

  if (!idempotencyKey || idempotencyKey.length < 16 || idempotencyKey.length > 128) {
    return NextResponse.json({ error: 'A valid X-Idempotency-Key header is required.' }, { status: 400 })
  }

  try {
    console.log('[Checkout API] POST /api/payments/create-order request received')
    const result = await createPremiumOrder(idempotencyKey)
    console.log('[Checkout API] Premium order created successfully:', result.orderId)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('[Checkout API] Error creating payment order:', error)
    if (error instanceof PaymentServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    const message = error instanceof Error ? error.message : 'Unable to create payment order.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}