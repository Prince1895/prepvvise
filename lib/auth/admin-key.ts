import 'server-only'

import { timingSafeEqual } from 'node:crypto'

function resolveAdminKey() {
  const raw = process.env.ADMIN_SECRET_KEY ?? ''
  return String(raw).trim()
}

export function getAdminSecretKey() {
  return resolveAdminKey()
}

export function hasAdminSecretKey() {
  return getAdminSecretKey().length > 0
}

/** Timing-safe comparison so key guessing can't use response timing. */
export function isValidAdminKey(candidate: unknown) {
  const expected = getAdminSecretKey()
  const value = String(candidate ?? '').trim()
  if (!expected || !value) return false
  const a = Buffer.from(value)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/** Pull the admin key from header, query param, or cookie (in that order). */
export function getAdminKeyFromRequest(request: Request) {
  const headerKey = request.headers.get('x-admin-key')
  if (headerKey) return headerKey

  try {
    const url = new URL(request.url)
    const queryKey = url.searchParams.get('key') ?? url.searchParams.get('adminKey')
    if (queryKey) return queryKey
  } catch {
    // ignore malformed URL — fall through to cookies
  }

  const cookieHeader = request.headers.get('cookie') ?? ''
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === 'admin_key') {
      const raw = rest.join('=')
      try {
        return decodeURIComponent(raw)
      } catch {
        return raw
      }
    }
  }

  return null
}

export function isAdminKeyRequest(request: Request) {
  return isValidAdminKey(getAdminKeyFromRequest(request))
}
