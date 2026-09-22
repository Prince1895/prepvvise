import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { z } from 'zod'

import { connectToDatabase, User, WebhookEvent } from '@/lib/db/client'

const clerkEventSchema = z.object({
  type: z.enum(['user.created', 'user.updated', 'user.deleted']),
  data: z.object({
    id: z.string().min(1),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    email_addresses: z.array(z.object({
      id: z.string(),
      email_address: z.string().email(),
    })).default([]),
    primary_email_address_id: z.string().nullable().optional(),
  }).passthrough(),
}).passthrough()

function getHeaderValue(requestHeaders: Headers, name: string) {
  const value = requestHeaders.get(name)

  if (!value) {
    throw new Error(`Missing ${name} header.`)
  }

  return value
}

export async function POST(request: Request) {
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET

  if (!signingSecret) {
    return NextResponse.json({ error: 'Webhook signing secret is not configured.' }, { status: 500 })
  }

  const requestHeaders = await headers()
  const payload = await request.text()

  let event: unknown
  let eventId: string

  try {
    const webhook = new Webhook(signingSecret)
    event = webhook.verify(payload, {
      'svix-id': getHeaderValue(requestHeaders, 'svix-id'),
      'svix-timestamp': getHeaderValue(requestHeaders, 'svix-timestamp'),
      'svix-signature': getHeaderValue(requestHeaders, 'svix-signature'),
    })
    eventId = getHeaderValue(requestHeaders, 'svix-id')
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 })
  }

  const parsedEvent = clerkEventSchema.safeParse(event)

  if (!parsedEvent.success) {
    return NextResponse.json({ error: 'Invalid Clerk webhook payload.' }, { status: 400 })
  }

  await connectToDatabase()

  const { type, data } = parsedEvent.data

  const existingEvent = await WebhookEvent.findOne({ provider: 'clerk', eventId }).lean()
  if (existingEvent) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  const webhookDoc = await WebhookEvent.create({
    provider: 'clerk',
    eventId,
    eventType: type,
    payload: parsedEvent.data,
  })

  try {
    if (type === 'user.deleted') {
      await User.deleteOne({ clerkUserId: data.id })
    } else {
      const primaryEmail = data.email_addresses.find((email) => email.id === data.primary_email_address_id)?.email_address
      const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || null

      await User.findOneAndUpdate(
        { clerkUserId: data.id },
        {
          clerkUserId: data.id,
          name,
          email: primaryEmail ?? null,
        },
        { upsert: true, new: true }
      )
    }

    await WebhookEvent.findByIdAndUpdate(webhookDoc._id, {
      processedAt: new Date(),
    })
  } catch {
    return NextResponse.json({ error: 'Unable to synchronize Clerk user.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
