import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'

import { PaymentServiceError, processRazorpayWebhook } from '@/lib/services/payments'

const MAX_WEBHOOK_BYTES = 256_000

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  const signature = request.headers.get('x-razorpay-signature')
  const contentLength = Number(request.headers.get('content-length') ?? 0)

  if (contentLength > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: 'Webhook payload is too large.' }, { status: 413 })
  }

  const payload = await request.text()

  if (Buffer.byteLength(payload, 'utf8') > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: 'Webhook payload is too large.' }, { status: 413 })
  }

  if (!secret || !signature) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 })
  }

  const expected = createHmac('sha256', secret).update(payload).digest('hex')
  const valid = expected.length === signature.length
    && timingSafeEqual(Buffer.from(expected), Buffer.from(signature))

  if (!valid) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 })
  }

  let eventId = request.headers.get('x-razorpay-event-id')

  if (!eventId) {
    eventId = createHash('sha256').update(payload).digest('hex')
  }

  try {
    return NextResponse.json(await processRazorpayWebhook(payload, eventId))
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: 'Unable to process Razorpay webhook.' }, { status: 500 })
  }
}