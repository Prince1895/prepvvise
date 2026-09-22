import { timingSafeEqual } from 'node:crypto'
import Razorpay from 'razorpay'
import { z } from 'zod'

import { requireCurrentAppUser } from '@/lib/auth/current-user'
import {
  connectToDatabase,
  Payment,
  Subscription,
  User,
  WebhookEvent,
} from '@/lib/db/client'

export const PREMIUM_AMOUNT_PAISE = 5900
export const PREMIUM_CURRENCY = 'INR'
const PREMIUM_PROVIDER_SUBSCRIPTION_ID_PREFIX = 'prepvvise-premium'

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
})

export class PaymentServiceError extends Error {
  constructor(public readonly status: 400 | 403 | 404 | 409 | 502, message: string) {
    super(message)
  }
}

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    console.error('[Checkout API] Razorpay configuration missing: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not set in environment')
    throw new PaymentServiceError(502, 'Razorpay payment provider is not configured on server.')
  }

  const RazorpayCtor = (Razorpay as unknown as { default?: typeof Razorpay }).default ?? Razorpay
  return { client: new RazorpayCtor({ key_id: keyId, key_secret: keySecret }), keyId, keySecret }
}

function paymentStatusForWebhook(eventType: string) {
  if (eventType === 'payment.captured' || eventType === 'order.paid') return 'captured' as const
  if (eventType === 'payment.failed') return 'failed' as const
  if (eventType === 'payment.cancelled') return 'cancelled' as const
  if (eventType === 'payment.refunded') return 'refunded' as const
  if (eventType === 'payment.disputed' || eventType === 'payment.dispute.created') return 'disputed' as const
  return null
}

async function activatePremium(userId: string, paymentId: string, providerPaymentId: string) {
  await connectToDatabase()
  const providerSubscriptionId = `${PREMIUM_PROVIDER_SUBSCRIPTION_ID_PREFIX}-${userId}`

  const subscription = await Subscription.findOneAndUpdate(
    { provider: 'razorpay', providerSubscriptionId },
    { userId, status: 'active', updatedAt: new Date() },
    { upsert: true, returnDocument: 'after' }
  ).lean()

  await Payment.findByIdAndUpdate(paymentId, {
    subscriptionId: String(subscription?._id),
    providerPaymentId,
    status: 'captured',
    updatedAt: new Date(),
  })

  await User.findByIdAndUpdate(userId, {
    plan: 'premium',
    updatedAt: new Date(),
  })
}

export async function createPremiumOrder(idempotencyKey: string) {
  const user = await requireCurrentAppUser()
  await connectToDatabase()

  if (user.plan === 'premium') {
    throw new PaymentServiceError(409, 'Premium is already active.')
  }

  const { client, keyId } = getRazorpayClient()

  const existing = await Payment.findOne({ userId: user.id, idempotencyKey }).lean()

  if (existing?.providerOrderId) {
    return {
      orderId: existing.providerOrderId,
      amount: PREMIUM_AMOUNT_PAISE,
      currency: PREMIUM_CURRENCY,
      keyId,
      status: existing.status,
      reused: true,
    }
  }

  if (existing) {
    throw new PaymentServiceError(409, 'An order with this idempotency key is already being created.')
  }

  const payment = await Payment.create({
    userId: user.id,
    provider: 'razorpay',
    idempotencyKey,
    amountPaise: PREMIUM_AMOUNT_PAISE,
    currency: PREMIUM_CURRENCY,
    status: 'created',
  })

  let order: { id: string }

  try {
    order = await client.orders.create({
      amount: PREMIUM_AMOUNT_PAISE,
      currency: PREMIUM_CURRENCY,
      receipt: `prepvvise_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: { userId: user.id, plan: 'premium' },
    })
  } catch {
    await Payment.findByIdAndUpdate(payment._id, { status: 'failed', updatedAt: new Date() })
    throw new PaymentServiceError(502, 'Unable to create Razorpay order.')
  }

  await Payment.findByIdAndUpdate(payment._id, {
    providerOrderId: order.id,
    updatedAt: new Date(),
  })

  return {
    orderId: order.id,
    amount: PREMIUM_AMOUNT_PAISE,
    currency: PREMIUM_CURRENCY,
    keyId,
    status: 'created' as const,
    reused: false,
  }
}

export async function verifyPremiumPayment(input: z.infer<typeof verifyPaymentSchema>) {
  const user = await requireCurrentAppUser()
  await connectToDatabase()

  const payment = await Payment.findOne({
    userId: user.id,
    provider: 'razorpay',
    providerOrderId: input.razorpayOrderId,
  }).lean()

  if (!payment) {
    throw new PaymentServiceError(404, 'Payment order not found.')
  }

  if (payment.status === 'captured') {
    return { premium: true, status: payment.status, reused: true }
  }

  const { client, keySecret } = getRazorpayClient()
  const crypto = await import('node:crypto')
  const signature = crypto.createHmac('sha256', keySecret)
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
    .digest('hex')

  const expected = Buffer.from(signature)
  const provided = Buffer.from(input.razorpaySignature)

  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    throw new PaymentServiceError(400, 'Invalid Razorpay payment signature.')
  }

  let razorpayPayment: { id: string; order_id: string; amount: string | number; currency: string; status: string }

  try {
    razorpayPayment = await client.payments.fetch(input.razorpayPaymentId)
  } catch {
    throw new PaymentServiceError(400, 'Unable to verify Razorpay payment.')
  }

  if (
    razorpayPayment.id !== input.razorpayPaymentId
    || razorpayPayment.order_id !== payment.providerOrderId
    || Number(razorpayPayment.amount) !== PREMIUM_AMOUNT_PAISE
    || razorpayPayment.currency !== PREMIUM_CURRENCY
  ) {
    throw new PaymentServiceError(400, 'Razorpay payment details do not match the order.')
  }

  if (razorpayPayment.status !== 'captured') {
    await Payment.findByIdAndUpdate(payment._id, {
      providerPaymentId: razorpayPayment.id,
      status: razorpayPayment.status === 'authorized' ? 'authorized' : 'failed',
      updatedAt: new Date(),
    })
    return { premium: false, status: razorpayPayment.status }
  }

  await activatePremium(user.id, String(payment._id), razorpayPayment.id)
  return { premium: true, status: 'captured' as const, reused: false }
}

const razorpayEventSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z.object({ entity: z.object({
      id: z.string().optional(),
      order_id: z.string().optional(),
      amount: z.coerce.number().optional(),
      currency: z.string().optional(),
    }).passthrough() }).optional(),
    order: z.object({ entity: z.object({
      id: z.string().optional(),
      amount: z.coerce.number().optional(),
      currency: z.string().optional(),
    }).passthrough() }).optional(),
  }).passthrough(),
}).passthrough()

export async function processRazorpayWebhook(rawPayload: string, eventId: string) {
  let payload: unknown

  try {
    payload = JSON.parse(rawPayload)
  } catch {
    throw new PaymentServiceError(400, 'Invalid Razorpay webhook payload.')
  }

  const parsed = razorpayEventSchema.safeParse(payload)

  if (!parsed.success) {
    throw new PaymentServiceError(400, 'Invalid Razorpay webhook payload.')
  }

  await connectToDatabase()

  let recordDoc: any
  try {
    recordDoc = await WebhookEvent.create({
      provider: 'razorpay',
      eventId,
      eventType: parsed.data.event,
      payload: parsed.data,
    })
  } catch {
    return { duplicate: true }
  }

  const recordId = String(recordDoc._id)
  const status = paymentStatusForWebhook(parsed.data.event)
  const paymentEntity = parsed.data.payload.payment?.entity
  const orderEntity = parsed.data.payload.order?.entity
  const providerOrderId = paymentEntity?.order_id ?? orderEntity?.id
  const providerPaymentId = paymentEntity?.id

  if (!status || (!providerOrderId && !providerPaymentId)) {
    await WebhookEvent.findByIdAndUpdate(recordId, { processedAt: new Date(), updatedAt: new Date() })
    return { duplicate: false, ignored: true }
  }

  const orConditions: any[] = []
  if (providerOrderId) orConditions.push({ providerOrderId })
  if (providerPaymentId) orConditions.push({ providerPaymentId })

  const payment = await Payment.findOne({ $or: orConditions }).lean()

  if (!payment) {
    await WebhookEvent.findByIdAndUpdate(recordId, { processedAt: new Date(), updatedAt: new Date() })
    return { duplicate: false, ignored: true }
  }

  const amount = paymentEntity?.amount ?? orderEntity?.amount
  const currency = paymentEntity?.currency ?? orderEntity?.currency

  if (status === 'captured' && (amount !== PREMIUM_AMOUNT_PAISE || currency !== PREMIUM_CURRENCY)) {
    await Payment.findByIdAndUpdate(payment._id, { status: 'failed', updatedAt: new Date() })
  } else {
    await Payment.findByIdAndUpdate(payment._id, {
      status,
      providerPaymentId: providerPaymentId ?? payment.providerPaymentId,
      updatedAt: new Date(),
    })

    if (status === 'captured') {
      await activatePremium(String(payment.userId), String(payment._id), providerPaymentId ?? payment.providerPaymentId ?? '')
    } else if (status === 'refunded' || status === 'disputed') {
      if (payment.subscriptionId) {
        await Subscription.findByIdAndUpdate(payment.subscriptionId, {
          status: status === 'refunded' ? 'expired' : 'paused',
          updatedAt: new Date(),
        })
      }
      await User.findByIdAndUpdate(payment.userId, { plan: 'free', updatedAt: new Date() })
    }
  }

  await WebhookEvent.findByIdAndUpdate(recordId, { processedAt: new Date(), updatedAt: new Date() })
  return { duplicate: false, ignored: false }
}
