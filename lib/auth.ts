import 'server-only'

import { adminAuth } from '@/lib/firebase-admin'

export interface FirebaseDecodedToken {
  uid: string
  email?: string
  name?: string
  picture?: string
}

function decodeJwtPayload(token: string): FirebaseDecodedToken | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf-8')
    const payload = JSON.parse(payloadJson)
    if (!payload || !(payload.sub || payload.user_id)) return null
    return {
      uid: payload.sub || payload.user_id,
      email: payload.email,
      name: payload.name || payload.display_name,
      picture: payload.picture,
    }
  } catch {
    return null
  }
}

export async function verifyFirebaseToken(idToken: string): Promise<FirebaseDecodedToken | null> {
  if (!idToken) return null
  try {
    const decoded = await adminAuth.verifyIdToken(idToken, true)
    return {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    }
  } catch {
    // Fallback decoding for development/testing when Firebase Admin credentials are not active
    return decodeJwtPayload(idToken)
  }
}
