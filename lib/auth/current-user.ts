import 'server-only'

import { headers } from 'next/headers'

import { verifyFirebaseToken } from '@/lib/auth'
import { connectToDatabase, User } from '@/lib/db/client'

export function normalizeEmail(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

function extractTokenFromHeaders(reqHeaders: Headers): string | null {
  const authHeader = reqHeaders.get('authorization') || reqHeaders.get('Authorization')
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.substring(7).trim()
  }

  const cookieHeader = reqHeaders.get('cookie') || ''
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === 'firebase_token' || name === '__session' || name === 'token') {
      const val = rest.join('=').trim()
      if (val) {
        try {
          return decodeURIComponent(val)
        } catch {
          return val
        }
      }
    }
  }

  return null
}

export async function requireAuth() {
  const reqHeaders = await headers()
  const token = extractTokenFromHeaders(reqHeaders)
  if (!token) {
    throw new Error('Authentication required.')
  }

  const decoded = await verifyFirebaseToken(token)
  if (!decoded || !decoded.uid) {
    throw new Error('Authentication required.')
  }

  return {
    userId: decoded.uid,
    session: {
      user: {
        id: decoded.uid,
        email: decoded.email ?? '',
        name: decoded.name ?? null,
      },
    },
  }
}

export async function getCurrentAppUser() {
  const { userId, session } = await requireAuth()
  await connectToDatabase()

  const sessionEmailRaw = (session.user.email ?? '') as string
  const sessionEmail = normalizeEmail(sessionEmailRaw)

  let user = await User.findOne({ clerkUserId: userId }).lean()

  if (!user && sessionEmail) {
    user = await User.findOne({ email: new RegExp(`^${sessionEmail}$`, 'i') }).lean()
    if (user) {
      user = await User.findByIdAndUpdate(
        user._id,
        {
          clerkUserId: userId,
          name: session.user.name ?? user.name,
          email: sessionEmailRaw || user.email,
        },
        { returnDocument: 'after' }
      ).lean()
    }
  }

  if (user) {
    if (normalizeEmail(user.email) !== sessionEmail && sessionEmail.length > 0) {
      user = await User.findByIdAndUpdate(
        user._id,
        { email: sessionEmailRaw },
        { returnDocument: 'after' }
      ).lean()
    }
    return user ? { ...user, id: String(user._id) } : null
  }

  const created = await User.create({
    clerkUserId: userId,
    name: session.user.name,
    email: sessionEmailRaw,
    role: 'student',
    plan: 'free',
  })

  const createdObj = created.toObject()
  return { ...createdObj, id: String(createdObj._id) }
}

export async function requireCurrentAppUser() {
  const user = await getCurrentAppUser()

  if (!user) {
    throw new Error('Authentication required: user record has not been synchronized.')
  }

  return user
}
